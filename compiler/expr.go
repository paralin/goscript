package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"

	"github.com/pkg/errors"
)

// WriteIndexExpr translates a Go index expression (a[b]) to its TypeScript equivalent.
func (c *GoToTSCompiler) WriteIndexExpr(exp *ast.IndexExpr) error {
	// Handle map access: use Map.get() instead of brackets for reading values
	if tv, ok := c.pkg.TypesInfo.Types[exp.X]; ok {
		underlyingType := tv.Type.Underlying()
		// Check if it's a map type
		if mapType, isMap := underlyingType.(*types.Map); isMap {
			c.tsw.WriteLiterally("$.mapGet(")
			if err := c.WriteValueExpr(exp.X); err != nil {
				return err
			}
			c.tsw.WriteLiterally(", ")
			if err := c.WriteValueExpr(exp.Index); err != nil {
				return err
			}
			c.tsw.WriteLiterally(", ")

			// Generate the zero value as the default value for mapGet
			c.WriteZeroValueForType(mapType.Elem())
			c.tsw.WriteLiterally(")")
			return nil
		}

		// Check if it's a string type
		if basicType, isBasic := underlyingType.(*types.Basic); isBasic && (basicType.Info()&types.IsString) != 0 {
			c.tsw.WriteLiterally("$.indexString(")
			if err := c.WriteValueExpr(exp.X); err != nil {
				return err
			}
			c.tsw.WriteLiterally(", ")
			if err := c.WriteValueExpr(exp.Index); err != nil {
				return err
			}
			c.tsw.WriteLiterally(")")
			return nil
		}
	}

	// Regular array/slice access: use brackets
	if err := c.WriteValueExpr(exp.X); err != nil {
		return err
	}
	c.tsw.WriteLiterally("![") // non-null assertion
	if err := c.WriteValueExpr(exp.Index); err != nil {
		return err
	}
	c.tsw.WriteLiterally("]")
	return nil
}

// WriteTypeAssertExpr translates a Go type assertion expression (e.g., `x.(T)`)
// into a TypeScript call to `$.typeAssert<T_ts>(x_ts, 'TypeName').value`.
// The `$.typeAssert` runtime function handles the actual type check and panic
// if the assertion fails. The `.value` access is used because in an expression
// context, we expect the asserted value directly. The `TypeName` string is used
// by the runtime for error messages.
func (c *GoToTSCompiler) WriteTypeAssertExpr(exp *ast.TypeAssertExpr) error {
	// Generate a call to $.typeAssert
	c.tsw.WriteLiterally("$.mustTypeAssert<")
	c.WriteTypeExpr(exp.Type) // Write the asserted type for the generic
	c.tsw.WriteLiterally(">(")
	if err := c.WriteValueExpr(exp.X); err != nil { // The interface expression
		return fmt.Errorf("failed to write interface expression in type assertion expression: %w", err)
	}
	c.tsw.WriteLiterally(", ")

	// Unwrap parenthesized expressions to handle cases like r.((<-chan T))
	typeExpr := exp.Type
	for {
		if parenExpr, ok := typeExpr.(*ast.ParenExpr); ok {
			typeExpr = parenExpr.X
		} else {
			break
		}
	}

	c.writeTypeDescription(typeExpr)

	c.tsw.WriteLiterally(")")

	return nil
}

// isPointerComparison checks if a binary expression `exp` involves comparing
// two pointer types. It uses `go/types` information to determine the types
// of the left (X) and right (Y) operands of the binary expression.
// Returns `true` if both operands are determined to be pointer types,
// `false` otherwise. This is used to apply specific comparison semantics
// for pointers (e.g., comparing the box objects directly).
func (c *GoToTSCompiler) isPointerComparison(exp *ast.BinaryExpr) bool {
	leftType := c.pkg.TypesInfo.TypeOf(exp.X)
	rightType := c.pkg.TypesInfo.TypeOf(exp.Y)
	if leftType != nil && rightType != nil {
		if _, leftIsPtr := leftType.(*types.Pointer); leftIsPtr {
			if _, rightIsPtr := rightType.(*types.Pointer); rightIsPtr {
				return true
			}
		}
	}
	return false
}

// getTypeNameString returns a string representation of a Go type expression (`ast.Expr`).
// It handles simple identifiers (e.g., `MyType`) and selector expressions
// (e.g., `pkg.Type`). For more complex or unrecognized type expressions,
// it returns "unknown". This string is primarily used for runtime error messages,
// such as in type assertions.
func (c *GoToTSCompiler) getTypeNameString(typeExpr ast.Expr) string {
	switch t := typeExpr.(type) {
	case *ast.Ident:
		return t.Name
	case *ast.SelectorExpr:
		// For imported types like pkg.Type
		if ident, ok := t.X.(*ast.Ident); ok {
			return fmt.Sprintf("%s.%s", ident.Name, t.Sel.Name)
		}
	}
	// Default case, use a placeholder for complex types
	return "unknown"
}

// WriteBinaryExpr translates a Go binary expression (`ast.BinaryExpr`) into its
// TypeScript equivalent.
// It handles several cases:
//   - Channel send (`ch <- val`): Becomes `await ch.send(val)`.
//   - Nil comparison for pointers (`ptr == nil` or `ptr != nil`): Compares the
//     pointer (which may be a box object or `null`) directly to `null` using
//     the translated operator (`==` or `!=`).
//   - Pointer comparison (non-nil, `ptr1 == ptr2` or `ptr1 != ptr2`): Compares
//     the box objects directly using strict equality (`===` or `!==`).
//   - Bitwise operations (`&`, `|`, `^`, `<<`, `>>`, `&^`): The expression is wrapped
//     in parentheses `()` to ensure correct precedence in TypeScript, and operators
//     are mapped (e.g., `&^` might need special handling or is mapped to a runtime helper).
//   - Other binary operations (arithmetic, logical, comparison): Operands are
//     translated using `WriteValueExpr`, and the operator is mapped to its TypeScript
//     equivalent using `TokenToTs`.
//
// Unhandled operators result in a comment and a placeholder.
func (c *GoToTSCompiler) WriteBinaryExpr(exp *ast.BinaryExpr) error {
	// Handle special cases like channel send
	if exp.Op == token.ARROW {
		// Channel send: ch <- val becomes await ch.send(val)
		c.tsw.WriteLiterally("await ")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write channel send target: %w", err)
		}
		c.tsw.WriteLiterally(".send(")
		if err := c.WriteValueExpr(exp.Y); err != nil {
			return fmt.Errorf("failed to write channel send value: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	}

	// Check if this is a nil comparison for a pointer
	isNilComparison := false
	var ptrExpr ast.Expr
	if (exp.Op == token.EQL || exp.Op == token.NEQ) && c.pkg != nil && c.pkg.TypesInfo != nil {
		if leftIdent, ok := exp.Y.(*ast.Ident); ok && leftIdent.Name == "nil" {
			leftType := c.pkg.TypesInfo.TypeOf(exp.X)
			if _, isPtr := leftType.(*types.Pointer); isPtr {
				isNilComparison = true
				ptrExpr = exp.X
			}
		} else if rightIdent, ok := exp.X.(*ast.Ident); ok && rightIdent.Name == "nil" {
			rightType := c.pkg.TypesInfo.TypeOf(exp.Y)
			if _, isPtr := rightType.(*types.Pointer); isPtr {
				isNilComparison = true
				ptrExpr = exp.Y
			}
		}
	}

	if isNilComparison {
		// Compare the box object directly to null
		if err := c.WriteValueExpr(ptrExpr); err != nil {
			return fmt.Errorf("failed to write pointer expression in nil comparison: %w", err)
		}
		c.tsw.WriteLiterally(" ")
		tokStr, ok := TokenToTs(exp.Op)
		if !ok {
			return errors.Errorf("unhandled binary op: %s", exp.Op.String())
		}
		c.tsw.WriteLiterally(tokStr)
		c.tsw.WriteLiterally(" null")
		return nil
	}

	// Check if this is a pointer comparison (non-nil)
	// Compare the box objects directly using === or !==
	if c.isPointerComparison(exp) {
		c.tsw.WriteLiterally("(") // Wrap comparison
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write binary expression left operand: %w", err)
		}
		c.tsw.WriteLiterally(" ")
		// Use === for == and !== for !=
		tokStr := ""
		switch exp.Op {
		case token.EQL:
			tokStr = "==="
		case token.NEQ:
			tokStr = "!=="
		default:
			return errors.Errorf("unhandled pointer comparison op: %s", exp.Op.String())
		}
		c.tsw.WriteLiterally(tokStr)
		c.tsw.WriteLiterally(" ")
		if err := c.WriteValueExpr(exp.Y); err != nil {
			return fmt.Errorf("failed to write binary expression right operand: %w", err)
		}
		c.tsw.WriteLiterally(")") // Close wrap
		return nil
	}

	// Check if the operator is a bitwise operator
	isBitwise := false
	switch exp.Op {
	case token.AND, token.OR, token.XOR, token.SHL, token.SHR, token.AND_NOT:
		isBitwise = true
	}

	if isBitwise {
		c.tsw.WriteLiterally("(") // Add opening parenthesis for bitwise operations
	}

	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write binary expression left operand: %w", err)
	}
	c.tsw.WriteLiterally(" ")
	tokStr, ok := TokenToTs(exp.Op)
	if !ok {
		return errors.Errorf("unhandled binary op: %s", exp.Op.String())
	}
	c.tsw.WriteLiterally(tokStr)
	c.tsw.WriteLiterally(" ")
	if err := c.WriteValueExpr(exp.Y); err != nil {
		return fmt.Errorf("failed to write binary expression right operand: %w", err)
	}

	if isBitwise {
		c.tsw.WriteLiterally(")") // Add closing parenthesis for bitwise operations
	}

	return nil
}

// WriteUnaryExpr translates a Go unary expression (`ast.UnaryExpr`) into its
// TypeScript equivalent.
// It handles several unary operations:
// - Channel receive (`<-ch`): Becomes `await ch.receive()`.
// - Address-of (`&var`):
//   - If `var` is a boxed variable (its address was taken), `&var` evaluates
//     to the box itself (i.e., `varName` in TypeScript, which holds the box).
//   - Otherwise (e.g., `&unboxedVar`, `&MyStruct{}`, `&FuncCall()`), it evaluates
//     the operand `var`. The resulting TypeScript value (e.g., a new object instance)
//     acts as the "pointer". Boxing decisions for such pointers are handled at
//     the assignment site.
//   - Other unary operators (`+`, `-`, `!`, `^`): Mapped to their TypeScript
//     equivalents (e.g., `+`, `-`, `!`, `~` for bitwise NOT). Parentheses are added
//     around the operand if it's a binary or unary expression to maintain precedence.
//
// Unhandled operators result in a comment and an attempt to write the operator
// token directly. Postfix operators (`++`, `--`) are expected to be handled by
// their statement contexts (e.g., `IncDecStmt`).
func (c *GoToTSCompiler) WriteUnaryExpr(exp *ast.UnaryExpr) error {
	if exp.Op == token.ARROW {
		// Channel receive: <-ch becomes await ch.receive()
		c.tsw.WriteLiterally("await ")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write channel receive operand: %w", err)
		}
		c.tsw.WriteLiterally(".receive()")
		return nil
	}

	if exp.Op == token.AND { // Address-of operator (&)
		// If the operand is an identifier for a variable that is boxed,
		// the result of & is the box itself.
		if ident, ok := exp.X.(*ast.Ident); ok {
			var obj types.Object
			obj = c.pkg.TypesInfo.Uses[ident]
			if obj == nil {
				obj = c.pkg.TypesInfo.Defs[ident]
			}
			if obj != nil && c.analysis.NeedsBoxed(obj) {
				// &boxedVar -> boxedVar (the box itself)
				c.tsw.WriteLiterally(ident.Name) // Write the identifier name (which holds the box)
				return nil
			}
		}

		// Otherwise (&unboxedVar, &CompositeLit{}, &FuncCall(), etc.),
		// the address-of operator in Go, when used to create a pointer,
		// translates to simply evaluating the operand in TypeScript.
		// The resulting value (e.g., a new object instance) acts as the "pointer".
		// Boxing decisions are handled at the assignment site based on the LHS variable.
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write &-operand: %w", err)
		}

		return nil
	}

	// Handle other unary operators (+, -, !, ^)
	tokStr, ok := TokenToTs(exp.Op)
	if !ok {
		return errors.Errorf("unhandled unary op: %s", exp.Op.String())
	}
	c.tsw.WriteLiterally(tokStr)

	// Add space if operator is not postfix (e.g., !)
	if exp.Op != token.INC && exp.Op != token.DEC {
		// Check if operand needs parentheses (e.g., !(-a))
		// Basic check: if operand is binary or unary, add parens
		needsParens := false
		switch exp.X.(type) {
		case *ast.BinaryExpr, *ast.UnaryExpr:
			needsParens = true
		}
		if needsParens {
			c.tsw.WriteLiterally("(")
		}
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write unary expression operand: %w", err)
		}
		if needsParens {
			c.tsw.WriteLiterally(")")
		}
	} else {
		// Postfix operators (++, --) - operand written first by caller (e.g., IncDecStmt)
		// This function shouldn't be called directly for ++/-- in expression context in valid Go?
		// If it is, write the operand.
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write unary expression operand for postfix op: %w", err)
		}
	}

	return nil
}

// WriteSliceExpr translates a Go slice expression (e.g., `s[low:high:max]`) to its TypeScript equivalent.
// If `s` is a string and it's not a 3-index slice, it uses `s.substring(low, high)`.
// If `s` is `[]byte` (Uint8Array) and it's not a 3-index slice, it uses `s.subarray(low, high)`.
// Otherwise, it falls back to the `$.goSlice(s, low, high, max)` runtime helper.
func (c *GoToTSCompiler) WriteSliceExpr(exp *ast.SliceExpr) error {
	// Check if the expression being sliced is a string
	tv := c.pkg.TypesInfo.TypeOf(exp.X)
	isString := false
	isByteSlice := false
	if tv != nil {
		if basicType, isBasic := tv.Underlying().(*types.Basic); isBasic && (basicType.Info()&types.IsString) != 0 {
			isString = true
		}
		if sliceType, isSlice := tv.Underlying().(*types.Slice); isSlice {
			if basicElem, isBasic := sliceType.Elem().(*types.Basic); isBasic && basicElem.Kind() == types.Uint8 {
				isByteSlice = true
			}
		}
	}

	if isString && !exp.Slice3 {
		// Use $.sliceString for byte-correct string slicing
		c.tsw.WriteLiterally("$.sliceString(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally(", ")
		if exp.Low != nil {
			if err := c.WriteValueExpr(exp.Low); err != nil {
				return err
			}
		} else {
			// Go's default low for string[:high] is 0.
			// $.sliceString can handle undefined for low as 0.
			c.tsw.WriteLiterally("undefined")
		}
		c.tsw.WriteLiterally(", ")
		if exp.High != nil {
			if err := c.WriteValueExpr(exp.High); err != nil {
				return err
			}
		} else {
			// Go's default high for string[low:] means to the end.
			// $.sliceString can handle undefined for high as end of string.
			c.tsw.WriteLiterally("undefined")
		}
		c.tsw.WriteLiterally(")")
	} else if isByteSlice && !exp.Slice3 {
		// Use s.subarray(low, high) for []byte slices
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally(".subarray(")
		if exp.Low != nil {
			if err := c.WriteValueExpr(exp.Low); err != nil {
				return err
			}
		} else {
			c.tsw.WriteLiterally("0") // Default low for subarray is 0
		}
		if exp.High != nil {
			c.tsw.WriteLiterally(", ")
			if err := c.WriteValueExpr(exp.High); err != nil {
				return err
			}
		} else {
			// If high is omitted, subarray goes to the end of the array.
			// No need to write undefined or length, just close the parenthesis if low was the last arg.
		}
		c.tsw.WriteLiterally(")")
	} else {
		// Fallback to $.goSlice for actual slices (arrays) or 3-index string slices (which are rare and might need $.goSlice's complexity)
		// Or if it's a string but has Slice3, it's not handled by simple substring.
		c.tsw.WriteLiterally("$.goSlice(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally(", ")
		if exp.Low != nil {
			if err := c.WriteValueExpr(exp.Low); err != nil {
				return err
			}
		} else {
			c.tsw.WriteLiterally("undefined")
		}
		c.tsw.WriteLiterally(", ")
		if exp.High != nil {
			if err := c.WriteValueExpr(exp.High); err != nil {
				return err
			}
		} else {
			c.tsw.WriteLiterally("undefined")
		}
		if exp.Slice3 {
			c.tsw.WriteLiterally(", ")
			if exp.Max != nil {
				if err := c.WriteValueExpr(exp.Max); err != nil {
					return err
				}
			} else {
				c.tsw.WriteLiterally("undefined")
			}
		}
		c.tsw.WriteLiterally(")")
	}
	return nil
}

// WriteKeyValueExpr translates a Go key-value pair expression (`ast.KeyValueExpr`),
// typically found within composite literals (for structs, maps, or arrays with
// indexed elements), into its TypeScript object property equivalent: `key: value`.
// Both the key and the value expressions are recursively translated using
// `WriteValueExpr`. The original Go casing for keys is preserved.
// For example, `MyField: 123` in Go becomes `MyField: 123` in TypeScript.
func (c *GoToTSCompiler) WriteKeyValueExpr(exp *ast.KeyValueExpr) error {
	// Keep original Go casing for keys
	if err := c.WriteValueExpr(exp.Key); err != nil {
		return fmt.Errorf("failed to write key-value expression key: %w", err)
	}
	c.tsw.WriteLiterally(": ")
	if err := c.WriteValueExpr(exp.Value); err != nil {
		return fmt.Errorf("failed to write key-value expression value: %w", err)
	}
	return nil
}
