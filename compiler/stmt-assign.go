package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
	"strings"

	"github.com/pkg/errors"
)

// WriteStmtAssign translates a Go assignment statement (`ast.AssignStmt`) into
// its TypeScript equivalent. It handles various forms of Go assignments:
//
// 1.  **Multi-variable assignment from a single function call** (e.g., `a, b := fn()`):
//   - Uses `writeMultiVarAssignFromCall` to generate `let [a, b] = fn_ts();`.
//
// 2.  **Type assertion with comma-ok** (e.g., `val, ok := expr.(Type)`):
//   - Uses `writeTypeAssertion` to generate `let { value: val, ok: ok } = $.typeAssert<Type_ts>(expr_ts, 'TypeName');`.
//
// 3.  **Map lookup with comma-ok** (e.g., `val, ok := myMap[key]`):
//   - Uses `writeMapLookupWithExists` to generate separate assignments for `val`
//     (using `myMap_ts.get(key_ts) ?? zeroValue`) and `ok` (using `myMap_ts.has(key_ts)`).
//
// 4.  **Channel receive with comma-ok** (e.g., `val, ok := <-ch`):
//   - Uses `writeChannelReceiveWithOk` to generate `let { value: val, ok: ok } = await ch_ts.receiveWithOk();`.
//
// 5.  **Discarded channel receive** (e.g., `<-ch` on RHS, no LHS vars):
//   - Translates to `await ch_ts.receive();`.
//
// 6.  **Single assignment** (e.g., `x = y`, `x := y`, `*p = y`, `x[i] = y`):
//   - Uses `writeAssignmentCore` which handles:
//   - Blank identifier `_` on LHS (evaluates RHS for side effects).
//   - Assignment to dereferenced pointer `*p = val` -> `p_ts!.value = val_ts`.
//   - Short declaration `x := y`: `let x = y_ts;`. If `x` is boxed, `let x: $.Box<T> = $.box(y_ts);`.
//   - Regular assignment `x = y`, including compound assignments like `x += y`.
//   - Assignment to map index `m[k] = v` using `$.mapSet`.
//   - Struct value assignment `s1 = s2` becomes `s1 = s2.clone()` if `s2` is a struct.
//
// 7.  **Multi-variable assignment with multiple RHS values** (e.g., `a, b = x, y`):
//   - Uses `writeAssignmentCore` to generate `[a,b] = [x_ts, y_ts];` (or `let [a,b] = ...` for `:=`).
//
// The function ensures that the number of LHS and RHS expressions matches for
// most cases, erroring if they don't, except for specifically handled patterns
// like multi-assign from single call or discarded channel receive.
// It correctly applies `let` for `:=` (define) tokens and handles boxing and
// cloning semantics based on type information and analysis.
func (c *GoToTSCompiler) WriteStmtAssign(exp *ast.AssignStmt) error {
	// writeMultiVarAssignFromCall handles multi-variable assignment from a single function call.
	writeMultiVarAssignFromCall := func(lhs []ast.Expr, callExpr *ast.CallExpr, tok token.Token) error {
		// For token.DEFINE (:=), we need to check if any of the variables are already declared
		// In Go, := can be used for redeclaration if at least one variable is new
		if tok == token.DEFINE {
			// For token.DEFINE (:=), we need to handle variable declarations differently
			// In Go, := can redeclare existing variables if at least one variable is new

			// First, identify which variables are new vs existing
			newVars := make([]bool, len(lhs))
			anyNewVars := false
			allNewVars := true

			// For multi-variable assignments with :=, we need to determine which variables
			// are already in scope and which are new declarations
			for i, lhsExpr := range lhs {
				if ident, ok := lhsExpr.(*ast.Ident); ok && ident.Name != "_" {
					// In Go, variables declared with := can be redeclared if at least one is new
					// For TypeScript, we need to separately declare new variables

					// Check if this variable is already in scope
					// - If the variable is used elsewhere before this point, it's existing
					// - Otherwise, it's a new variable being declared
					isNew := true

					// Check if the variable is used elsewhere in the code
					if obj := c.pkg.TypesInfo.Uses[ident]; obj != nil {
						// If it's in Uses, it's referenced elsewhere, so it exists
						isNew = false
						allNewVars = false
					}

					newVars[i] = isNew
					if isNew {
						anyNewVars = true
					}
				}
			}

			// Get function return types if available
			var resultTypes []*types.Var
			if callExpr.Fun != nil {
				if funcType, ok := c.pkg.TypesInfo.TypeOf(callExpr.Fun).Underlying().(*types.Signature); ok {
					if funcType.Results() != nil && funcType.Results().Len() > 0 {
						for i := 0; i < funcType.Results().Len(); i++ {
							resultTypes = append(resultTypes, funcType.Results().At(i))
						}
					}
				}
			}

			if allNewVars && anyNewVars {
				c.tsw.WriteLiterally("let [")

				for i, lhsExpr := range lhs {
					if i != 0 {
						c.tsw.WriteLiterally(", ")
					}

					if ident, ok := lhsExpr.(*ast.Ident); ok {
						if ident.Name == "_" {
							// For underscore variables, use empty slots in destructuring pattern
						} else {
							c.WriteIdent(ident, false)
						}
					} else {
						c.WriteValueExpr(lhsExpr)
					}
				}
				c.tsw.WriteLiterally("] = ")
				c.WriteValueExpr(callExpr)
				c.tsw.WriteLine("")
				return nil
			} else if anyNewVars {
				// If only some variables are new, declare them separately before the assignment
				// Declare each new variable with appropriate type
				for i, lhsExpr := range lhs {
					if ident, ok := lhsExpr.(*ast.Ident); ok && ident.Name != "_" && newVars[i] {
						c.tsw.WriteLiterally("let ")
						c.WriteIdent(ident, false)

						// Add type annotation if we have type information
						if i < len(resultTypes) {
							c.tsw.WriteLiterally(": ")
							c.WriteGoType(resultTypes[i].Type())
						}

						c.tsw.WriteLine("")
					}
				}
			}
		}

		// First, collect all the selector expressions to identify variables that need to be initialized
		hasSelectors := false
		for _, lhsExpr := range lhs {
			if _, ok := lhsExpr.(*ast.SelectorExpr); ok {
				hasSelectors = true
				break
			}
		}

		// If we have selector expressions, we need to ensure variables are initialized
		// before the destructuring assignment
		if hasSelectors {
			c.tsw.WriteLiterally("{")
			c.tsw.WriteLine("")

			// Write a temporary variable to hold the function call result
			c.tsw.WriteLiterally("  const _tmp = ")
			if err := c.WriteValueExpr(callExpr); err != nil {
				return fmt.Errorf("failed to write RHS call expression in assignment: %w", err)
			}
			c.tsw.WriteLine("")

			for i, lhsExpr := range lhs {
				// Skip underscore variables
				if ident, ok := lhsExpr.(*ast.Ident); ok && ident.Name == "_" {
					continue
				}

				// Write the LHS with indentation
				c.tsw.WriteLiterally("  ")
				if ident, ok := lhsExpr.(*ast.Ident); ok {
					c.WriteIdent(ident, false)
				} else if selectorExpr, ok := lhsExpr.(*ast.SelectorExpr); ok {
					if err := c.WriteValueExpr(selectorExpr); err != nil {
						return fmt.Errorf("failed to write selector expression in LHS: %w", err)
					}
				} else {
					return errors.Errorf("unhandled LHS expression in assignment: %T", lhsExpr)
				}

				// Write the assignment
				c.tsw.WriteLiterallyf(" = _tmp[%d]", i)
				// Always add a newline after each assignment
				c.tsw.WriteLine("")
			}

			// Close the block scope
			c.tsw.WriteLiterally("}")
			c.tsw.WriteLine("")

			return nil
		}

		// For simple cases without selector expressions, use array destructuring
		c.tsw.WriteLiterally("[")

		for i, lhsExpr := range lhs {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}

			if ident, ok := lhsExpr.(*ast.Ident); ok {
				// For underscore variables, use empty slots in destructuring pattern
				if ident.Name != "_" {
					c.WriteIdent(ident, false)
				}
			} else if selectorExpr, ok := lhsExpr.(*ast.SelectorExpr); ok {
				// Handle selector expressions (e.g., a.b) by using WriteValueExpr
				if err := c.WriteValueExpr(selectorExpr); err != nil {
					return fmt.Errorf("failed to write selector expression in LHS: %w", err)
				}
			} else {
				// Should not happen for valid Go code in this context, but handle defensively
				return errors.Errorf("unhandled LHS expression in destructuring: %T", lhsExpr)
			}
		}
		c.tsw.WriteLiterally("] = ")

		// Write the right-hand side (the function call)
		if err := c.WriteValueExpr(callExpr); err != nil {
			return fmt.Errorf("failed to write RHS call expression in assignment: %w", err)
		}

		c.tsw.WriteLine("")
		return nil
	}

	// writeMapLookupWithExists handles the map comma-ok idiom: value, exists := myMap[key]
	// Note: We don't use WriteIndexExpr here because we need to handle .has() and .get() separately
	writeMapLookupWithExists := func(lhs []ast.Expr, indexExpr *ast.IndexExpr, tok token.Token) error {
		// First check that we have exactly two LHS expressions (value and exists)
		if len(lhs) != 2 {
			return fmt.Errorf("map comma-ok idiom requires exactly 2 variables on LHS, got %d", len(lhs))
		}

		// Check for blank identifiers and get variable names
		valueIsBlank := false
		existsIsBlank := false
		var valueName string
		var existsName string

		if valIdent, ok := lhs[0].(*ast.Ident); ok {
			if valIdent.Name == "_" {
				valueIsBlank = true
			} else {
				valueName = valIdent.Name
			}
		} else {
			return fmt.Errorf("unhandled LHS expression type for value in map comma-ok: %T", lhs[0])
		}

		if existsIdent, ok := lhs[1].(*ast.Ident); ok {
			if existsIdent.Name == "_" {
				existsIsBlank = true
			} else {
				existsName = existsIdent.Name
			}
		} else {
			return fmt.Errorf("unhandled LHS expression type for exists in map comma-ok: %T", lhs[1])
		}

		// Declare variables if using := and not blank
		if tok == token.DEFINE {
			if !valueIsBlank {
				c.tsw.WriteLiterally("let ")
				c.tsw.WriteLiterally(valueName)
				// TODO: Add type annotation based on map value type
				c.tsw.WriteLine("")
			}
			if !existsIsBlank {
				c.tsw.WriteLiterally("let ")
				c.tsw.WriteLiterally(existsName)
				c.tsw.WriteLiterally(": boolean") // exists is always boolean
				c.tsw.WriteLine("")
			}
		}

		// Assign 'exists'
		if !existsIsBlank {
			c.tsw.WriteLiterally(existsName)
			c.tsw.WriteLiterally(" = ")
			c.tsw.WriteLiterally("$.mapHas(")
			if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
				return err
			}
			c.tsw.WriteLiterally(", ")
			if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
				return err
			}
			c.tsw.WriteLiterally(")")
			c.tsw.WriteLine("")
		}

		// Assign 'value'
		if !valueIsBlank {
			c.tsw.WriteLiterally(valueName)
			c.tsw.WriteLiterally(" = ")
			c.tsw.WriteLiterally("$.mapGet(")
			if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
				return err
			}
			c.tsw.WriteLiterally(", ")
			if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
				return err
			}
			c.tsw.WriteLiterally(", ")
			// Write the zero value for the map's value type
			if tv, ok := c.pkg.TypesInfo.Types[indexExpr.X]; ok {
				if mapType, isMap := tv.Type.Underlying().(*types.Map); isMap {
					c.WriteZeroValueForType(mapType.Elem())
				} else {
					// Fallback zero value if type info is missing or not a map
					c.tsw.WriteLiterally("null")
				}
			} else {
				c.tsw.WriteLiterally("null")
			}
			c.tsw.WriteLiterally(")")
			c.tsw.WriteLine("")
		} else if existsIsBlank {
			// If both are blank, still evaluate for side effects (though .has/.get are usually pure)
			// We add a ; otherwise TypeScript thinks we are invoking a function.
			c.tsw.WriteLiterally(";(") // Wrap in parens to make it an expression statement
			c.tsw.WriteLiterally("$.mapHas(")
			if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
				return err
			}
			c.tsw.WriteLiterally(", ")
			if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
				return err
			}
			c.tsw.WriteLiterally("), ") // Evaluate .has
			c.tsw.WriteLiterally("$.mapGet(")
			if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
				return err
			}
			c.tsw.WriteLiterally(", ")
			if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
				return err
			}
			c.tsw.WriteLiterally(", null))") // Evaluate .get with null as default
			c.tsw.WriteLine("")
		}

		return nil
	}

	// Handle multi-variable assignment from a single expression.
	if len(exp.Lhs) > 1 && len(exp.Rhs) == 1 {
		rhsExpr := exp.Rhs[0]
		if typeAssertExpr, ok := rhsExpr.(*ast.TypeAssertExpr); ok {
			return c.writeTypeAssert(exp.Lhs, typeAssertExpr, exp.Tok)
		} else if indexExpr, ok := rhsExpr.(*ast.IndexExpr); ok {
			// Check if this is a map lookup (comma-ok idiom)
			if len(exp.Lhs) == 2 {
				// Get the type of the indexed expression
				if c.pkg != nil && c.pkg.TypesInfo != nil {
					tv, ok := c.pkg.TypesInfo.Types[indexExpr.X]
					if ok {
						// Check if it's a map type
						if _, isMap := tv.Type.Underlying().(*types.Map); isMap {
							return writeMapLookupWithExists(exp.Lhs, indexExpr, exp.Tok)
						}
					}
				}
			}
		} else if unaryExpr, ok := rhsExpr.(*ast.UnaryExpr); ok && unaryExpr.Op == token.ARROW {
			// Handle val, ok := <-channel
			if len(exp.Lhs) == 2 {
				return c.writeChannelReceiveWithOk(exp.Lhs, unaryExpr, exp.Tok)
			}
			// If LHS count is not 2, fall through to error or other handling
		} else if callExpr, ok := rhsExpr.(*ast.CallExpr); ok {
			return writeMultiVarAssignFromCall(exp.Lhs, callExpr, exp.Tok)
		}
		// If none of the specific multi-assign patterns match, fall through to the error check below
	}

	// Ensure LHS and RHS have the same length for valid Go code in these cases
	if len(exp.Lhs) != len(exp.Rhs) {
		return fmt.Errorf("invalid assignment statement: LHS count (%d) != RHS count (%d)", len(exp.Lhs), len(exp.Rhs))
	}

	// Handle multi-variable assignment (e.g., swaps) using writeAssignmentCore
	if len(exp.Lhs) > 1 {
		// Need to handle := for multi-variable declarations
		if exp.Tok == token.DEFINE {
			c.tsw.WriteLiterally("let ") // Use let for multi-variable declarations
		}
		// For multi-variable assignments, we've already added the "let" if needed
		if err := c.writeAssignmentCore(exp.Lhs, exp.Rhs, exp.Tok, false); err != nil {
			return err
		}
		// Handle potential inline comment for multi-variable assignment
		c.writeInlineComment(exp)
		c.tsw.WriteLine("") // Add newline after the statement
		return nil
	}

	// Handle single assignment using writeAssignmentCore
	if len(exp.Lhs) == 1 {
		addDeclaration := exp.Tok == token.DEFINE
		if err := c.writeAssignmentCore(exp.Lhs, exp.Rhs, exp.Tok, addDeclaration); err != nil {
			return err
		}
		// Handle potential inline comment for single assignment
		c.writeInlineComment(exp)
		c.tsw.WriteLine("") // Add newline after the statement
		return nil
	}

	// Should not reach here if LHS/RHS counts are valid and handled
	return fmt.Errorf("unhandled assignment case")
}

// writeInlineComment checks for and writes any inline comments associated with the given AST node.
// It is intended to be called immediately after writing the main statement/expression.
func (c *GoToTSCompiler) writeInlineComment(node ast.Node) {
	if c.pkg == nil || c.pkg.Fset == nil || !node.End().IsValid() {
		return
	}

	file := c.pkg.Fset.File(node.End())
	if file == nil {
		return
	}

	endLine := file.Line(node.End())
	// Check comments associated *directly* with the node
	for _, cg := range c.analysis.Cmap[node] {
		if cg.Pos().IsValid() && file.Line(cg.Pos()) == endLine && cg.Pos() > node.End() {
			commentText := strings.TrimSpace(strings.TrimPrefix(cg.Text(), "//"))
			c.tsw.WriteLiterally(" // " + commentText)
			return // Only write the first inline comment found
		}
	}
}
