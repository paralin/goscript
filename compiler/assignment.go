package compiler

import (
	"go/ast"
	"go/token"
	"go/types"

	"golang.org/x/tools/go/packages"
)

// writeAssignmentCore handles the central logic for translating Go assignment
// operations (LHS op RHS) into TypeScript. It's called by `WriteStmtAssign`
// and other functions that need to generate assignment code.
//
// Key behaviors:
//   - Multi-variable assignment (e.g., `a, b = b, a`): Translates to TypeScript
//     array destructuring: `[a_ts, b_ts] = [b_ts, a_ts]`. It correctly handles
//     non-null assertions for array index expressions on both LHS and RHS if
//     all expressions involved are index expressions (common in swaps).
//   - Single-variable assignment to a map index (`myMap[key] = value`): Translates
//     to `$.mapSet(myMap_ts, key_ts, value_ts)`.
//   - Other single-variable assignments (`variable = value`):
//   - The LHS expression is written (caller typically ensures `.value` is appended
//     if assigning to a VarRefed variable's content).
//   - The Go assignment token (`tok`, e.g., `=`, `+=`) is translated to its
//     TypeScript equivalent using `TokenToTs`.
//   - The RHS expression(s) are written. If `shouldApplyClone` indicates the RHS
//     is a struct value, `.clone()` is appended to the translated RHS to emulate
//     Go's value semantics for struct assignment.
//   - Blank identifiers (`_`) on the LHS are handled by omitting them in TypeScript
//     destructuring patterns or by skipping the assignment for single assignments.
//
// This function handles all assignment types including:
// - Pointer dereference assignments (*p = v)
// - Blank identifier assignments (_ = v)
func (c *GoToTSCompiler) writeAssignmentCore(lhs, rhs []ast.Expr, tok token.Token, addDeclaration bool) error {
	// Handle blank identifier (_) on the LHS for single assignments
	if len(lhs) == 1 && len(rhs) == 1 {
		if ident, ok := lhs[0].(*ast.Ident); ok && ident.Name == "_" {
			// Evaluate the RHS expression for side effects, but don't assign it
			c.tsw.WriteLiterally("/* _ = */ ")
			if err := c.WriteValueExpr(rhs[0]); err != nil {
				return err
			}
			return nil
		}

		// Handle the special case of "*p = val" (assignment to dereferenced pointer)
		if starExpr, ok := lhs[0].(*ast.StarExpr); ok {
			// For *p = val, we need to set p's .value property
			// Write "p!.value = " for the underlying value
			if err := c.WriteValueExpr(starExpr.X); err != nil { // p in *p
				return err
			}
			c.tsw.WriteLiterally("!.value = ") // Add non-null assertion for TS safety

			// Handle the RHS expression (potentially adding .clone() for structs)
			if shouldApplyClone(c.pkg, rhs[0]) {
				if err := c.WriteValueExpr(rhs[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(".clone()")
			} else {
				if err := c.WriteValueExpr(rhs[0]); err != nil {
					return err
				}
			}
			return nil
		}

		// Handle variable referenced variables in declarations
		if addDeclaration && tok == token.DEFINE {
			// Determine if LHS is variable referenced
			isLHSVarRefed := false
			var lhsIdent *ast.Ident
			var lhsObj types.Object

			if ident, ok := lhs[0].(*ast.Ident); ok {
				lhsIdent = ident
				// Get the types.Object from the identifier
				if use, ok := c.pkg.TypesInfo.Uses[ident]; ok {
					lhsObj = use
				} else if def, ok := c.pkg.TypesInfo.Defs[ident]; ok {
					lhsObj = def
				}

				// Check if this variable needs to be variable referenced
				if lhsObj != nil && c.analysis.NeedsVarRef(lhsObj) {
					isLHSVarRefed = true
				}
			}

			// Handle short declaration of variable referenced variables
			if isLHSVarRefed && lhsIdent != nil {
				c.tsw.WriteLiterally("let ")
				// Just write the identifier name without .value
				c.tsw.WriteLiterally(c.sanitizeIdentifier(lhsIdent.Name))
				// No type annotation, allow TypeScript to infer it from varRef.
				c.tsw.WriteLiterally(" = ")

				// Create the variable reference for the initializer
				c.tsw.WriteLiterally("$.varRef(")
				if err := c.WriteValueExpr(rhs[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil
			}

			c.tsw.WriteLiterally("let ")
		}
	}

	// Special case for multi-variable assignment to handle array element swaps
	if len(lhs) > 1 && len(rhs) > 1 {
		// Check if this is an array element swap pattern (common pattern a[i], a[j] = a[j], a[i])
		// Identify if we're dealing with array index expressions that might need null assertions
		allIndexExprs := true
		for _, expr := range append(lhs, rhs...) {
			_, isIndexExpr := expr.(*ast.IndexExpr)
			if !isIndexExpr {
				allIndexExprs = false
				break
			}
		}

		// Add semicolon before destructuring assignment to prevent TypeScript
		// from interpreting it as array access on the previous line
		if tok != token.DEFINE {
			c.tsw.WriteLiterally(";")
		}

		// Use array destructuring for multi-variable assignments
		c.tsw.WriteLiterally("[")
		for i, l := range lhs {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}

			// Handle blank identifier
			if ident, ok := l.(*ast.Ident); ok && ident.Name == "_" {
				// If it's a blank identifier, we write nothing,
				// leaving an empty slot in the destructuring array.
			} else if indexExpr, ok := l.(*ast.IndexExpr); ok && allIndexExprs { // MODIFICATION: Added 'else if'
				// Note: We don't use WriteIndexExpr here because we need direct array access for swapping
				if err := c.WriteValueExpr(indexExpr.X); err != nil {
					return err
				}
				c.tsw.WriteLiterally("!") // non-null assertion
				c.tsw.WriteLiterally("[")
				if err := c.WriteValueExpr(indexExpr.Index); err != nil {
					return err
				}
				c.tsw.WriteLiterally("]")
			} else {
				// Normal case - write the entire expression
				if err := c.WriteValueExpr(l); err != nil {
					return err
				}
			}
		}
		c.tsw.WriteLiterally("] = [")
		for i, r := range rhs {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			if indexExpr, ok := r.(*ast.IndexExpr); ok && allIndexExprs {
				// Note: We don't use WriteIndexExpr here because we need direct array access for swapping
				if err := c.WriteValueExpr(indexExpr.X); err != nil {
					return err
				}
				c.tsw.WriteLiterally("!")
				c.tsw.WriteLiterally("[")
				if err := c.WriteValueExpr(indexExpr.Index); err != nil {
					return err
				}
				c.tsw.WriteLiterally("]")
			} else if callExpr, isCallExpr := r.(*ast.CallExpr); isCallExpr {
				// If the RHS is a function call, write it as a call
				if err := c.WriteCallExpr(callExpr); err != nil {
					return err
				}
			} else {
				// Normal case - write the entire expression
				if err := c.WriteValueExpr(r); err != nil {
					return err
				}
			}
		}
		c.tsw.WriteLiterally("]")
		return nil
	}

	// --- Logic for assignments ---
	isMapIndexLHS := false // Track if the first LHS is a map index
	for i, l := range lhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}

		// Handle map indexing assignment specially
		// Note: We don't use WriteIndexExpr here because we need to use $.mapSet instead of .get
		currentIsMapIndex := false
		if indexExpr, ok := l.(*ast.IndexExpr); ok {
			if tv, ok := c.pkg.TypesInfo.Types[indexExpr.X]; ok {
				// Check if it's a concrete map type
				if _, isMap := tv.Type.Underlying().(*types.Map); isMap {
					currentIsMapIndex = true
					if i == 0 {
						isMapIndexLHS = true
					}
					// Use mapSet helper
					c.tsw.WriteLiterally("$.mapSet(")
					if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
						return err
					}
					c.tsw.WriteLiterally(", ")
					if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
						return err
					}
					c.tsw.WriteLiterally(", ")
					// Value will be added after operator and RHS
				} else if typeParam, isTypeParam := tv.Type.(*types.TypeParam); isTypeParam {
					// Check if the type parameter is constrained to be a map type
					constraint := typeParam.Constraint()
					if constraint != nil {
						underlying := constraint.Underlying()
						if iface, isInterface := underlying.(*types.Interface); isInterface {
							if hasMapConstraint(iface) {
								currentIsMapIndex = true
								if i == 0 {
									isMapIndexLHS = true
								}
								// Use mapSet helper for type parameter constrained to map
								c.tsw.WriteLiterally("$.mapSet(")
								if err := c.WriteValueExpr(indexExpr.X); err != nil { // Map
									return err
								}
								c.tsw.WriteLiterally(", ")
								if err := c.WriteValueExpr(indexExpr.Index); err != nil { // Key
									return err
								}
								c.tsw.WriteLiterally(", ")
								// Value will be added after operator and RHS
							}
						}
					}
				}
			}
		}

		if !currentIsMapIndex {
			// For single assignments, handle variable referenced variables specially
			if len(lhs) == 1 && len(rhs) == 1 {
				lhsExprIdent, lhsExprIsIdent := l.(*ast.Ident)
				if lhsExprIsIdent {
					// Determine if LHS is variable referenced
					isLHSVarRefed := false
					var lhsObj types.Object

					// Get the types.Object from the identifier
					if use, ok := c.pkg.TypesInfo.Uses[lhsExprIdent]; ok {
						lhsObj = use
					} else if def, ok := c.pkg.TypesInfo.Defs[lhsExprIdent]; ok {
						lhsObj = def
					}

					// Check if this variable needs to be variable referenced
					if lhsObj != nil && c.analysis.NeedsVarRef(lhsObj) {
						isLHSVarRefed = true
					}

					// prevent writing .value unless lhs is variable referenced
					c.WriteIdent(lhsExprIdent, isLHSVarRefed)
					continue
				}
			}

			// Write the LHS expression normally
			if err := c.WriteValueExpr(l); err != nil {
				return err
			}
		}
	}

	// Only write the assignment operator for regular variables, not for map assignments handled by mapSet
	if isMapIndexLHS && len(lhs) == 1 { // Only skip operator if it's a single map assignment
		// Continue, we've already written part of the mapSet() function call
	} else {
		c.tsw.WriteLiterally(" ")

		// Special handling for &^= (bitwise AND NOT assignment)
		if tok == token.AND_NOT_ASSIGN {
			// Transform x &^= y to x &= ~(y)
			c.tsw.WriteLiterally("&= ~(")
		} else {
			tokStr, ok := TokenToTs(tok) // Use explicit gstypes alias
			if !ok {
				c.tsw.WriteLiterally("?= ")
				c.tsw.WriteCommentLine("Unknown token " + tok.String())
			} else {
				c.tsw.WriteLiterally(tokStr)
			}
			c.tsw.WriteLiterally(" ")
		}
	}

	// Write RHS
	for i, r := range rhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}

		// Check if we need to access a variable referenced source value and apply clone
		// For struct value assignments, we need to handle:
		// 1. UnVarRefed source, unVarRefed target: source.clone()
		// 2. Variable referenced source, unVarRefed target: source.value.clone()
		// 3. UnVarRefed source, variable referenced target: $.varRef(source)
		// 4. Variable referenced source, variable referenced target: source (straight assignment of the variable reference)

		// Determine if RHS is a variable referenced variable (could be a struct or other variable)
		needsVarRefedAccessRHS := false
		var rhsObj types.Object

		// Check if RHS is an identifier (variable name)
		rhsIdent, rhsIsIdent := r.(*ast.Ident)
		if rhsIsIdent {
			rhsObj = c.pkg.TypesInfo.Uses[rhsIdent]
			if rhsObj == nil {
				rhsObj = c.pkg.TypesInfo.Defs[rhsIdent]
			}

			// Important: For struct copying, we need to check if the variable itself is variable referenced
			// Important: For struct copying, we need to check if the variable needs variable referenced access
			// This is more comprehensive than just checking if it's variable referenced
			if rhsObj != nil {
				needsVarRefedAccessRHS = c.analysis.NeedsVarRefAccess(rhsObj)
			}
		}

		// Handle different cases for struct cloning
		if shouldApplyClone(c.pkg, r) {
			// For other expressions, we need to handle variable referenced access differently
			if _, isIdent := r.(*ast.Ident); isIdent {
				// For identifiers, WriteValueExpr already adds .value if needed
				if err := c.WriteValueExpr(r); err != nil {
					return err
				}
			} else {
				// For non-identifiers, write the expression and add .value if needed
				if err := c.WriteValueExpr(r); err != nil {
					return err
				}
				// Only add .value for non-identifiers that need variable referenced access
				if needsVarRefedAccessRHS {
					c.tsw.WriteLiterally(".value") // Access the variable referenced value
				}
			}

			c.tsw.WriteLiterally(".clone()") // Always add clone for struct values
		} else {
			// Non-struct case: write RHS normally
			if err := c.WriteValueExpr(r); err != nil { // RHS is a non-struct value
				return err
			}
		}
	}

	// Close the parenthesis for &^= transformation
	if tok == token.AND_NOT_ASSIGN && !(isMapIndexLHS && len(lhs) == 1) {
		c.tsw.WriteLiterally(")")
	}

	// If the LHS was a single map index, close the mapSet call
	if isMapIndexLHS && len(lhs) == 1 {
		c.tsw.WriteLiterally(")")
	}
	return nil
}

// shouldApplyClone determines whether a `.clone()` method call should be appended
// to the TypeScript translation of a Go expression `rhs` when it appears on the
// right-hand side of an assignment. This is primarily to emulate Go's value
// semantics for struct assignments, where assigning one struct variable to another
// creates a copy of the struct.
//
// It uses `go/types` information (`pkg.TypesInfo`) to determine the type of `rhs`.
//   - If `rhs` is identified as a struct type (either directly, as a named type
//     whose underlying type is a struct, or an unnamed type whose underlying type
//     is a struct), it returns `true`.
//   - An optimization: if `rhs` is a composite literal (`*ast.CompositeLit`),
//     it returns `false` because a composite literal already produces a new value,
//     so cloning is unnecessary.
//   - If type information is unavailable or `rhs` is not a struct type, it returns `false`.
//
// This function is crucial for ensuring that assignments of struct values in
// TypeScript behave like copies, as they do in Go, rather than reference assignments.
func shouldApplyClone(pkg *packages.Package, rhs ast.Expr) bool {
	if pkg == nil || pkg.TypesInfo == nil {
		// Cannot determine type without type info, default to no clone
		return false
	}

	// Get the type of the RHS expression
	var exprType types.Type

	// Handle identifiers (variables) directly - the most common case
	if ident, ok := rhs.(*ast.Ident); ok {
		if obj := pkg.TypesInfo.Uses[ident]; obj != nil {
			// Get the type directly from the object
			exprType = obj.Type()
		} else if obj := pkg.TypesInfo.Defs[ident]; obj != nil {
			// Also check Defs map for definitions
			exprType = obj.Type()
		}
	}

	// If we couldn't get the type from Uses/Defs, try getting it from Types
	if exprType == nil {
		if tv, found := pkg.TypesInfo.Types[rhs]; found && tv.Type != nil {
			exprType = tv.Type
		}
	}

	// No type information available
	if exprType == nil {
		return false
	}

	// Optimizations: Don't clone for expressions that already produce fresh values
	
	// If it's a composite literal for a struct, no need to clone
	// as it's already a fresh value
	if _, isCompositeLit := rhs.(*ast.CompositeLit); isCompositeLit {
		return false
	}
	
	// If it's a function call, no need to clone as function results are already fresh values
	if _, isCallExpr := rhs.(*ast.CallExpr); isCallExpr {
		return false
	}

	// Check if it's a struct type (directly, through named type, or underlying)
	if named, ok := exprType.(*types.Named); ok {
		if _, isStruct := named.Underlying().(*types.Struct); isStruct {
			return true // Named struct type
		}
	} else if _, ok := exprType.(*types.Struct); ok {
		return true // Direct struct type
	} else if underlying := exprType.Underlying(); underlying != nil {
		if _, isStruct := underlying.(*types.Struct); isStruct {
			return true // Underlying is a struct
		}
	}

	return false // Not a struct, do not apply clone
}
