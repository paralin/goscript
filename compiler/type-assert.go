package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"strings"
)

// writeTypeAssert handles the Go type assertion with comma-ok idiom in an
// assignment context: `value, ok := interfaceExpr.(AssertedType)` (or with `=`).
// It translates this to a TypeScript destructuring assignment (or declaration if `tok`
// is `token.DEFINE` for `:=`) using the `$.typeAssert` runtime helper.
//
// The generated TypeScript is:
// `[let] { value: valueName, ok: okName } = $.typeAssert<AssertedType_ts>(interfaceExpr_ts, 'AssertedTypeName');`
//
//   - `AssertedType_ts` is the TypeScript translation of `AssertedType`.
//   - `interfaceExpr_ts` is the TypeScript translation of `interfaceExpr`.
//   - `'AssertedTypeName'` is a string representation of the asserted type name,
//     obtained via `getTypeNameString`, used for runtime error messages.
//   - `valueName` and `okName` are the Go variable names from the LHS.
//   - Blank identifiers (`_`) on the LHS are handled by omitting the corresponding
//     property in the destructuring pattern (e.g., `{ ok: okName } = ...` if `value` is blank).
//   - If `tok` is not `token.DEFINE` (i.e., for regular assignment `=`), the entire
//     destructuring assignment is wrapped in parentheses `(...)` to make it a valid
//     expression if needed, though typically assignments are statements.
//
// The statement is terminated with a newline.
func (c *GoToTSCompiler) writeTypeAssert(lhs []ast.Expr, typeAssertExpr *ast.TypeAssertExpr, tok token.Token) error {
	interfaceExpr := typeAssertExpr.X
	assertedType := typeAssertExpr.Type

	// Unwrap parenthesized expressions to handle cases like r.((<-chan T))
	for {
		if parenExpr, ok := assertedType.(*ast.ParenExpr); ok {
			assertedType = parenExpr.X
		} else {
			break
		}
	}

	// Ensure LHS has exactly two expressions (value and ok)
	if len(lhs) != 2 {
		return fmt.Errorf("type assertion assignment requires exactly 2 variables on LHS, got %d", len(lhs))
	}

	var okIsBlank bool
	var okName string

	okExpr := lhs[1]
	okIdent, ok := okExpr.(*ast.Ident)
	if !ok {
		return fmt.Errorf("ok expression is not an identifier: %T", okExpr)
	}
	okIsBlank = okIdent.Name == "_"
	okName = okIdent.Name

	valueExpr := lhs[0]

	// Determine if 'ok' variable is new in 'tok == token.DEFINE' context.
	// This uses types.Info.Defs to see if the identifier is defined by this statement.
	var okIsNewInDefine bool
	if tok == token.DEFINE && !okIsBlank {
		if c.pkg.TypesInfo.Defs[okIdent] != nil {
			okIsNewInDefine = true
		}
	}

	switch vLHS := valueExpr.(type) {
	case *ast.Ident:
		var valueIsBlank bool
		var valueName string
		valueIdent := vLHS
		valueIsBlank = (valueIdent.Name == "_")
		valueName = valueIdent.Name

		var valueIsNewInDefine bool
		if tok == token.DEFINE && !valueIsBlank {
			if c.pkg.TypesInfo.Defs[valueIdent] != nil { // valueIdent is defined by this statement
				valueIsNewInDefine = true
			}
		}

		writeEndParen := false  // For wrapping assignment in parens to make it an expression
		letDestructure := false // True if 'let { value: v, ok: o } = ...' is appropriate

		if tok == token.DEFINE {
			anyNewVars := (valueIsNewInDefine && !valueIsBlank) || (okIsNewInDefine && !okIsBlank)
			// allVarsNewOrBlank means suitable for a single `let {v,o} = ...` destructuring
			allVarsNewOrBlank := (valueIsBlank || valueIsNewInDefine) && (okIsBlank || okIsNewInDefine)

			if allVarsNewOrBlank && anyNewVars {
				letDestructure = true
			} else if anyNewVars { // Mixed: some new, some existing. Declare new ones separately.
				if !valueIsBlank && valueIsNewInDefine {
					c.tsw.WriteLiterally("let ")
					c.tsw.WriteLiterally(valueName)
					c.tsw.WriteLiterally(": ")
					c.WriteTypeExpr(assertedType) // Use WriteTypeExpr for TS type annotation
					c.tsw.WriteLine("")
				}
				if !okIsBlank && okIsNewInDefine {
					c.tsw.WriteLiterally("let ")
					c.tsw.WriteLiterally(okName)
					c.tsw.WriteLiterally(": boolean")
					c.tsw.WriteLine("")
				}
				c.tsw.WriteLiterally("(") // Parenthesize the assignment part
				writeEndParen = true
			} else { // All variables exist
				c.tsw.WriteLiterally("(")
				writeEndParen = true
			}
		} else { // tok == token.ASSIGN
			c.tsw.WriteLiterally("(")
			writeEndParen = true
		}

		if letDestructure {
			c.tsw.WriteLiterally("let ")
		}

		// Write the destructuring part: { value: v, ok: o }
		c.tsw.WriteLiterally("{ ")
		parts := []string{}
		if !valueIsBlank {
			parts = append(parts, fmt.Sprintf("value: %s", valueName))
		}
		if !okIsBlank {
			parts = append(parts, fmt.Sprintf("ok: %s", okName))
		}
		c.tsw.WriteLiterally(strings.Join(parts, ", "))
		c.tsw.WriteLiterally(" } = $.typeAssert<")
		c.WriteTypeExpr(assertedType) // Generic: <AssertedTypeTS>
		c.tsw.WriteLiterally(">(")
		if err := c.WriteValueExpr(interfaceExpr); err != nil { // Arg1: interfaceExpr
			return fmt.Errorf("failed to write interface expression in type assertion call: %w", err)
		}
		c.tsw.WriteLiterally(", ")
		c.writeTypeDescription(assertedType) // Arg2: type info for runtime
		c.tsw.WriteLiterally(")")

		if writeEndParen {
			c.tsw.WriteLiterally(")")
		}
		c.tsw.WriteLine("")

	case *ast.SelectorExpr:
		// Handle s.field, ok := expr.(Type)
		tempValName := "_gs_ta_val_" // Fixed name for temporary value
		tempOkName := "_gs_ta_ok_"   // Fixed name for temporary ok status

		// Declare temporary variables:
		// let _gs_ta_val_: AssertedTypeTS;
		c.tsw.WriteLiterally("let ")
		c.tsw.WriteLiterally(tempValName)
		c.tsw.WriteLiterally(": ")
		c.WriteTypeExpr(assertedType) // TypeScript type for assertedType
		c.tsw.WriteLine("")

		// let _gs_ta_ok_: boolean;
		c.tsw.WriteLiterally("let ")
		c.tsw.WriteLiterally(tempOkName)
		c.tsw.WriteLiterally(": boolean")
		c.tsw.WriteLine("")

		// Perform type assertion into temporary variables:
		// ({ value: _gs_ta_val_, ok: _gs_ta_ok_ } = $.typeAssert<AssertedTypeTS>(expr, "GoTypeStr"));
		c.tsw.WriteLiterally("({ value: ")
		c.tsw.WriteLiterally(tempValName)
		c.tsw.WriteLiterally(", ok: ")
		c.tsw.WriteLiterally(tempOkName)
		c.tsw.WriteLiterally(" } = $.typeAssert<")
		c.WriteTypeExpr(assertedType) // Generic: <AssertedTypeTS>
		c.tsw.WriteLiterally(">(")
		if err := c.WriteValueExpr(interfaceExpr); err != nil { // Arg1: interfaceExpr
			return fmt.Errorf("failed to write interface expression in type assertion call: %w", err)
		}
		c.tsw.WriteLiterally(", ")
		c.writeTypeDescription(assertedType) // Arg2: type info for runtime
		c.tsw.WriteLine("))")

		// Assign temporary value to the selector expression:
		// s.f = _gs_ta_val_;
		if err := c.WriteValueExpr(vLHS); err != nil { // Writes selector expression (e.g., "s.f")
			return fmt.Errorf("failed to write LHS selector expression in type assertion: %w", err)
		}
		c.tsw.WriteLiterally(" = ")
		c.tsw.WriteLiterally(tempValName)
		c.tsw.WriteLine("")

		// Assign temporary ok to the ok variable (e.g., okName = _gs_ta_ok_; or let okName = ...)
		if !okIsBlank {
			if okIsNewInDefine { // okIsNewInDefine was determined earlier based on tok == token.DEFINE and Defs check
				c.tsw.WriteLiterally("let ")
			}
			c.tsw.WriteLiterally(okName)
			c.tsw.WriteLiterally(" = ")
			c.tsw.WriteLiterally(tempOkName)
			c.tsw.WriteLine("")
		}

	default:
		return fmt.Errorf("unhandled LHS expression type for value in type assertion: %T", valueExpr)
	}

	return nil
}
