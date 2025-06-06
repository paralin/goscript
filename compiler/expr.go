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
	// Check if this might be a generic function instantiation with a single type argument
	// In this case, the Index should be a type expression, not a value expression
	if tv, ok := c.pkg.TypesInfo.Types[exp.X]; ok {
		// If X is a function type, this might be generic instantiation
		if _, isFuncType := tv.Type.Underlying().(*types.Signature); isFuncType {
			// Check if the index is a type expression (identifier that refers to a type)
			if indexIdent, isIdent := exp.Index.(*ast.Ident); isIdent {
				// Check if this identifier refers to a type
				if obj := c.pkg.TypesInfo.Uses[indexIdent]; obj != nil {
					if _, isTypeName := obj.(*types.TypeName); isTypeName {
						// This is a generic function instantiation: f[T] -> f<T>
						if err := c.WriteValueExpr(exp.X); err != nil {
							return err
						}
						c.tsw.WriteLiterally("<")
						c.WriteTypeExpr(exp.Index)
						c.tsw.WriteLiterally(">")
						return nil
					}
				}
			}
		}
	}

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
			c.tsw.WriteLiterally(")[0]") // Extract the value from the tuple
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

		// Check if it's a type parameter with a union constraint (e.g., string | []byte)
		if typeParam, isTypeParam := tv.Type.(*types.TypeParam); isTypeParam {
			// Check if the type parameter is constrained to slice types
			constraint := typeParam.Constraint()
			if constraint != nil {
				underlying := constraint.Underlying()
				if iface, isInterface := underlying.(*types.Interface); isInterface {
					// Check if this is a map constraint (like ~map[K]V)
					if hasMapConstraint(iface) {
						// This is a map type parameter, use map access
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
						// For type parameters, we need to get the value type from the constraint
						mapValueType := getMapValueTypeFromConstraint(iface)
						if mapValueType != nil {
							c.WriteZeroValueForType(mapValueType)
						} else {
							c.tsw.WriteLiterally("null")
						}
						c.tsw.WriteLiterally(")[0]") // Extract the value from the tuple
						return nil
					}

					// Check if this is a mixed string/byte constraint (like string | []byte)
					if hasMixedStringByteConstraint(iface) {
						// For mixed constraints, use specialized function that returns number (byte value)
						c.tsw.WriteLiterally("$.indexStringOrBytes(")
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

					// Check if the constraint includes only slice types (pure slice constraint)
					if hasSliceConstraint(iface) {
						// This is a pure slice type parameter, use regular slice indexing
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
				}
			}

			// For other type parameters, use specialized function as fallback
			// that returns number (byte value) for better TypeScript typing
			c.tsw.WriteLiterally("$.indexStringOrBytes(")
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

// WriteIndexListExpr translates a Go generic function instantiation (f[T1, T2]) to its TypeScript equivalent (f<T1, T2>).
func (c *GoToTSCompiler) WriteIndexListExpr(exp *ast.IndexListExpr) error {
	// Write the function expression
	if err := c.WriteValueExpr(exp.X); err != nil {
		return err
	}

	// Write the type arguments using TypeScript syntax
	c.tsw.WriteLiterally("<")
	for i, typeArg := range exp.Indices {
		if i > 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteTypeExpr(typeArg)
	}
	c.tsw.WriteLiterally(">")

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
// for pointers (e.g., comparing the varRef objects directly).
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

// getFinalUnderlyingType traverses the chain of named types to find the ultimate underlying type.
// This handles cases like: type A B; type B C; type C string.
// Returns the final underlying type and whether the original type was a named type.
func (c *GoToTSCompiler) getFinalUnderlyingType(t types.Type) (types.Type, bool) {
	if t == nil {
		return nil, false
	}

	// Check if this is a named type
	namedType, isNamed := t.(*types.Named)
	if !isNamed {
		return t, false
	}

	// Follow the chain of named types to find the ultimate underlying type
	ultimate := namedType
	for {
		underlying := ultimate.Underlying()
		if underlyingNamed, isNamedUnderlying := underlying.(*types.Named); isNamedUnderlying {
			// Continue following the chain
			ultimate = underlyingNamed
		} else {
			// We've reached the final underlying type
			return underlying, true
		}
	}
}

// isNamedNumericType checks if a given type is a named type with an underlying numeric type.
func (c *GoToTSCompiler) isNamedNumericType(t types.Type) bool {
	finalType, wasNamed := c.getFinalUnderlyingType(t)
	if !wasNamed {
		return false
	}

	if basicType, isBasic := finalType.(*types.Basic); isBasic {
		info := basicType.Info()
		return (info&types.IsInteger) != 0 || (info&types.IsFloat) != 0
	}

	return false
}

// WriteBinaryExpr translates a Go binary expression (`ast.BinaryExpr`) into its
// TypeScript equivalent.
// It handles several cases:
//   - Channel send (`ch <- val`): Becomes `await ch.send(val)`.
//   - Nil comparison for pointers (`ptr == nil` or `ptr != nil`): Compares the
//     pointer (which may be a varRef object or `null`) directly to `null` using
//     the translated operator (`==` or `!=`).
//   - Pointer comparison (non-nil, `ptr1 == ptr2` or `ptr1 != ptr2`): Compares
//     the varRef objects directly using strict equality (`===` or `!==`).
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
		// Channel send: ch <- val becomes await $.chanSend(ch, val)
		c.tsw.WriteLiterally("await $.chanSend(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write channel send target: %w", err)
		}
		c.tsw.WriteLiterally(", ")
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
		// For nil comparisons, we need to decide whether to write .value or not
		// If the pointer variable is varrefed, we need to access .value
		if ident, ok := ptrExpr.(*ast.Ident); ok {
			if obj := c.pkg.TypesInfo.ObjectOf(ident); obj != nil {
				if c.analysis.NeedsVarRef(obj) {
					// Variable is varrefed, so we need to access .value
					c.WriteIdent(ident, true) // This will add .value
				} else {
					// Variable is not varrefed, write directly
					c.WriteIdent(ident, false)
				}
			} else {
				// No object info, write directly
				c.WriteIdent(ident, false)
			}
		} else {
			// For other expressions, use WriteValueExpr (but this might need review)
			if err := c.WriteValueExpr(ptrExpr); err != nil {
				return fmt.Errorf("failed to write pointer expression in nil comparison: %w", err)
			}
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
	// Compare the varRef objects directly using === or !==
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

	// Handle large bit shift expressions that would overflow in JavaScript
	if exp.Op == token.SHL {
		// Check if this is 1 << 63 pattern using constant evaluation
		leftValue := c.evaluateConstantExpr(exp.X)
		rightValue := c.evaluateConstantExpr(exp.Y)

		if leftValue != nil && rightValue != nil {
			if leftInt, leftOk := leftValue.(int); leftOk && leftInt == 1 {
				if rightInt, rightOk := rightValue.(int); rightOk && rightInt == 63 {
					// Replace 1 << 63 with Number.MAX_SAFE_INTEGER (9007199254740991)
					// This is the largest integer that can be exactly represented in JavaScript
					c.tsw.WriteLiterally("Number.MAX_SAFE_INTEGER")
					return nil
				}
			}
		}
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
//   - If `var` is a varrefed variable (its address was taken), `&var` evaluates
//     to the varRef itself (i.e., `varName` in TypeScript, which holds the varRef).
//   - Otherwise (e.g., `&unvarrefedVar`, `&MyStruct{}`, `&FuncCall()`), it evaluates
//     the operand `var`. The resulting TypeScript value (e.g., a new object instance)
//     acts as the "pointer". VarRefing decisions for such pointers are handled at
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
		// Channel receive: <-ch becomes await $.chanRecv(ch)
		c.tsw.WriteLiterally("await $.chanRecv(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write channel receive operand: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	}

	if exp.Op == token.AND { // Address-of operator (&)
		// If the operand is an identifier for a variable that is varrefed,
		// the result of & is the varRef itself.
		if ident, ok := exp.X.(*ast.Ident); ok {
			var obj types.Object
			obj = c.pkg.TypesInfo.Uses[ident]
			if obj == nil {
				obj = c.pkg.TypesInfo.Defs[ident]
			}
			if obj != nil && c.analysis.NeedsVarRef(obj) {
				// &varRefVar -> varRefVar (the variable reference itself)
				c.tsw.WriteLiterally(ident.Name) // Write the identifier name (which holds the variable reference)
				return nil
			}
		}

		// Otherwise (&unvarrefedVar, &CompositeLit{}, &FuncCall(), etc.),
		// the address-of operator in Go, when used to create a pointer,
		// translates to simply evaluating the operand in TypeScript.
		// The resulting value (e.g., a new object instance) acts as the "pointer".
		// VarRefing decisions are handled at the assignment site based on the LHS variable.
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

	// Special case: In Go, ^ is bitwise NOT when used as unary operator
	// In TypeScript, bitwise NOT is ~, not ^
	if exp.Op == token.XOR {
		tokStr = "~"
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
// If `s` is `[]byte` (Uint8Array) and it's not a 3-index slice, it uses $.goSlice.
// Otherwise, it falls back to the `$.goSlice(s, low, high, max)` runtime helper.
func (c *GoToTSCompiler) WriteSliceExpr(exp *ast.SliceExpr) error {
	// Check if the expression being sliced is a string
	tv := c.pkg.TypesInfo.TypeOf(exp.X)
	isString := false
	isTypeParam := false
	if tv != nil {
		if basicType, isBasic := tv.Underlying().(*types.Basic); isBasic && (basicType.Info()&types.IsString) != 0 {
			isString = true
		}
		if _, isTP := tv.(*types.TypeParam); isTP {
			isTypeParam = true
		}
	}

	// Handle type parameters with union constraints (e.g., string | []byte)
	if isTypeParam {
		// For type parameters, we need to create a runtime helper that handles both string and []byte
		c.tsw.WriteLiterally("$.sliceStringOrBytes(")
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
		return nil
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

// hasMapConstraint checks if an interface constraint includes map types
// For constraints like ~map[K]V, this returns true
func hasMapConstraint(iface *types.Interface) bool {
	// Check if the interface has type terms that include map types
	for i := 0; i < iface.NumEmbeddeds(); i++ {
		embedded := iface.EmbeddedType(i)
		if union, ok := embedded.(*types.Union); ok {
			for j := 0; j < union.Len(); j++ {
				term := union.Term(j)
				if _, isMap := term.Type().Underlying().(*types.Map); isMap {
					return true
				}
			}
		} else if _, isMap := embedded.Underlying().(*types.Map); isMap {
			return true
		}
	}
	return false
}

// getMapValueTypeFromConstraint extracts the value type from a map constraint
// For constraints like ~map[K]V, this returns V
func getMapValueTypeFromConstraint(iface *types.Interface) types.Type {
	// Check if the interface has type terms that include map types
	for i := 0; i < iface.NumEmbeddeds(); i++ {
		embedded := iface.EmbeddedType(i)
		if union, ok := embedded.(*types.Union); ok {
			for j := 0; j < union.Len(); j++ {
				term := union.Term(j)
				if mapType, isMap := term.Type().Underlying().(*types.Map); isMap {
					return mapType.Elem()
				}
			}
		} else if mapType, isMap := embedded.Underlying().(*types.Map); isMap {
			return mapType.Elem()
		}
	}
	return nil
}
