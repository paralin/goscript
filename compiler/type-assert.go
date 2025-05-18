package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
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

	// Get variable names, handling blank identifiers
	valueIsBlank := false
	okIsBlank := false
	var valueName string
	var okName string
	var valueIdent *ast.Ident
	var okIdent *ast.Ident

	if valId, ok := lhs[0].(*ast.Ident); ok {
		valueIdent = valId
		if valId.Name == "_" {
			valueIsBlank = true
		} else {
			valueName = valId.Name
		}
	} else {
		return fmt.Errorf("unhandled LHS expression type for value in type assertion: %T", lhs[0])
	}

	if okId, ok := lhs[1].(*ast.Ident); ok {
		okIdent = okId
		if okId.Name == "_" {
			okIsBlank = true
		} else {
			okName = okId.Name
		}
	} else {
		return fmt.Errorf("unhandled LHS expression type for ok in type assertion: %T", lhs[1])
	}

	// For token.DEFINE (:=), we need to check if any of the variables are already declared
	// In Go, := can be used for redeclaration if at least one variable is new
	writeEndParen := false
	if tok == token.DEFINE {
		// Identify which variables are new vs existing
		valueIsNew := true
		okIsNew := true
		anyNewVars := false
		allNewVars := true

		// Check if variables are already in scope
		if !valueIsBlank {
			if obj := c.pkg.TypesInfo.Uses[valueIdent]; obj != nil {
				// If it's in Uses, it's referenced elsewhere, so it exists
				valueIsNew = false
				allNewVars = false
			}
			if valueIsNew {
				anyNewVars = true
			}
		}

		if !okIsBlank {
			if obj := c.pkg.TypesInfo.Uses[okIdent]; obj != nil {
				// If it's in Uses, it's referenced elsewhere, so it exists
				okIsNew = false
				allNewVars = false
			}
			if okIsNew {
				anyNewVars = true
			}
		}

		if allNewVars && anyNewVars {
			c.tsw.WriteLiterally("let ")
		} else if anyNewVars {
			// If only some variables are new, declare them separately
			if !valueIsBlank && valueIsNew {
				c.tsw.WriteLiterally("let ")
				c.tsw.WriteLiterally(valueName)
				// Add type annotation if possible
				if tv, ok := c.pkg.TypesInfo.Types[assertedType]; ok {
					c.tsw.WriteLiterally(": ")
					c.WriteGoType(tv.Type)
				}
				c.tsw.WriteLine("")
			}
			if !okIsBlank && okIsNew {
				c.tsw.WriteLiterally("let ")
				c.tsw.WriteLiterally(okName)
				c.tsw.WriteLiterally(": boolean") // ok is always boolean
				c.tsw.WriteLine("")
			}
			// Use parenthesized destructuring assignment for existing variables
			c.tsw.WriteLiterally(";(")
			writeEndParen = true
		} else {
			// All variables exist, use parenthesized destructuring assignment
			c.tsw.WriteLiterally(";(")
			writeEndParen = true
		}
	} else {
		c.tsw.WriteLiterally("(")
	}

	c.tsw.WriteLiterally("{ ")
	// Dynamically build the destructuring pattern
	parts := []string{}
	if !valueIsBlank {
		parts = append(parts, fmt.Sprintf("value: %s", valueName))
	}
	if !okIsBlank {
		parts = append(parts, fmt.Sprintf("ok: %s", okName))
	}
	c.tsw.WriteLiterally(strings.Join(parts, ", "))
	c.tsw.WriteLiterally(" } = $.typeAssert<")

	// Write the asserted type for the generic
	c.WriteTypeExpr(assertedType)
	c.tsw.WriteLiterally(">(")

	// Write the interface expression
	if err := c.WriteValueExpr(interfaceExpr); err != nil {
		return fmt.Errorf("failed to write interface expression in type assertion call: %w", err)
	}
	c.tsw.WriteLiterally(", ")

	// Use structured type information for all types
	switch typeExpr := assertedType.(type) {
	case *ast.MapType:
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Map, ")

		c.tsw.WriteLiterally("keyType: ")
		if ident, ok := typeExpr.Key.(*ast.Ident); ok && isPrimitiveType(ident.Name) {
			if tsType, ok := GoBuiltinToTypescript(ident.Name); ok {
				c.tsw.WriteLiterallyf("'%s'", tsType)
			} else {
				c.tsw.WriteLiterallyf("'%s'", ident.Name) // Fallback
			}
		} else {
			c.writeTypeDescription(typeExpr.Key)
		}

		c.tsw.WriteLiterally(", ")

		// Add element type
		c.tsw.WriteLiterally("elemType: ")
		if ident, ok := typeExpr.Value.(*ast.Ident); ok && isPrimitiveType(ident.Name) {
			if tsType, ok := GoBuiltinToTypescript(ident.Name); ok {
				c.tsw.WriteLiterallyf("'%s'", tsType)
			} else {
				c.tsw.WriteLiterallyf("'%s'", ident.Name) // Fallback
			}
		} else {
			c.writeTypeDescription(typeExpr.Value)
		}

		c.tsw.WriteLiterally("}")
	case *ast.ArrayType:
		// Determine if it's a slice or array
		typeKind := "$.TypeKind.Slice"
		if typeExpr.Len != nil {
			typeKind = "$.TypeKind.Array"
		}

		// Create a type descriptor object
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterallyf("kind: %s, ", typeKind)

		// Add element type
		c.tsw.WriteLiterally("elemType: ")
		if ident, ok := typeExpr.Elt.(*ast.Ident); ok && isPrimitiveType(ident.Name) {
			if tsType, ok := GoBuiltinToTypescript(ident.Name); ok {
				c.tsw.WriteLiterallyf("'%s'", tsType)
			} else {
				c.tsw.WriteLiterallyf("'%s'", ident.Name) // Fallback
			}
		} else {
			c.writeTypeDescription(typeExpr.Elt)
		}

		c.tsw.WriteLiterally("}")
	case *ast.StructType:
		// For struct types, create a type descriptor object
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Struct")

		// Get the type name if available
		typeName := c.getTypeNameString(assertedType)
		if typeName != "unknown" {
			c.tsw.WriteLiterallyf(", name: '%s'", typeName)
		}

		if typeExpr.Fields != nil && typeExpr.Fields.List != nil {
			// Add fields property to provide type information
			c.tsw.WriteLiterally(", fields: {")

			hasFields := false
			for _, field := range typeExpr.Fields.List {
				if len(field.Names) > 0 {
					for _, name := range field.Names {
						if hasFields {
							c.tsw.WriteLiterally(", ")
						}
						c.tsw.WriteLiterally(fmt.Sprintf("'%s': ", name.Name))
						c.writeTypeDescription(field.Type)
						hasFields = true
					}
				}
			}

			c.tsw.WriteLiterally("}")
		} else {
			c.tsw.WriteLiterally(", fields: {}")
		}

		// Add empty methods set to satisfy StructTypeInfo interface
		c.tsw.WriteLiterally(", methods: []")

		c.tsw.WriteLiterally("}")
	case *ast.InterfaceType:
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Interface")

		// Get the type name if available
		typeName := c.getTypeNameString(assertedType)
		if typeName != "unknown" {
			c.tsw.WriteLiterallyf(", name: '%s'", typeName)
		}

		// Add methods if available
		c.tsw.WriteLiterally(", methods: []")

		c.tsw.WriteLiterally("}")
	case *ast.StarExpr:
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Pointer")

		// Add element type if it's a struct type or named type
		if structType, ok := typeExpr.X.(*ast.StructType); ok {
			c.tsw.WriteLiterally(", elemType: ")
			c.writeTypeDescription(structType)
		} else if ident, ok := typeExpr.X.(*ast.Ident); ok {
			c.tsw.WriteLiterallyf(", elemType: '%s'", ident.Name)
		}

		c.tsw.WriteLiterally("}")
	case *ast.ChanType:
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Channel")

		// Add element type
		c.tsw.WriteLiterally(", elemType: ")
		if ident, ok := typeExpr.Value.(*ast.Ident); ok && isPrimitiveType(ident.Name) {
			if tsType, ok := GoBuiltinToTypescript(ident.Name); ok {
				c.tsw.WriteLiterallyf("'%s'", tsType)
			} else {
				c.tsw.WriteLiterallyf("'%s'", ident.Name) // Fallback
			}
		} else {
			c.writeTypeDescription(typeExpr.Value)
		}

		c.tsw.WriteLiterally(", direction: ")
		switch typeExpr.Dir {
		case ast.SEND:
			c.tsw.WriteLiterally("'send'")
		case ast.RECV:
			c.tsw.WriteLiterally("'receive'")
		case ast.SEND | ast.RECV: // bidirectional
			c.tsw.WriteLiterally("'both'")
		default:
			// This should not happen, but just in case
			c.tsw.WriteLiterally("'both'")
		}

		c.tsw.WriteLiterally("}")
	case *ast.FuncType:
		// For function types, create a type descriptor object with params and results
		c.tsw.WriteLiterally("{")
		c.tsw.WriteLiterally("kind: $.TypeKind.Function")

		// Add name if this is a named function type
		if namedType := c.pkg.TypesInfo.TypeOf(typeExpr); namedType != nil {
			if named, ok := namedType.(*types.Named); ok {
				c.tsw.WriteLiterallyf(", name: '%s'", named.Obj().Name())
			}
		}

		// Add params if present
		if typeExpr.Params != nil && len(typeExpr.Params.List) > 0 {
			c.tsw.WriteLiterally(", params: [")
			for i, param := range typeExpr.Params.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.writeTypeDescription(param.Type)
			}
			c.tsw.WriteLiterally("]")
		}

		// Add results if present
		if typeExpr.Results != nil && len(typeExpr.Results.List) > 0 {
			c.tsw.WriteLiterally(", results: [")
			for i, result := range typeExpr.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.writeTypeDescription(result.Type)
			}
			c.tsw.WriteLiterally("]")
		}

		c.tsw.WriteLiterally("}")
	case *ast.Ident:
		if isPrimitiveType(typeExpr.Name) {
			c.tsw.WriteLiterally("{")
			c.tsw.WriteLiterally("kind: $.TypeKind.Basic, ")

			// Use TypeScript equivalent if available
			if tsType, ok := GoBuiltinToTypescript(typeExpr.Name); ok {
				c.tsw.WriteLiterallyf("name: '%s'", tsType) // TODO: use %q?
			} else {
				c.tsw.WriteLiterallyf("name: '%s'", typeExpr.Name)
			}

			c.tsw.WriteLiterally("}")
		} else {
			// Check if this is a named function type
			isFunctionType := false
			if namedType := c.pkg.TypesInfo.TypeOf(typeExpr); namedType != nil {
				if named, ok := namedType.(*types.Named); ok {
					if _, ok := named.Underlying().(*types.Signature); ok {
						// This is a named function type, generate a FunctionTypeInfo
						isFunctionType = true
						c.tsw.WriteLiterally("{")
						c.tsw.WriteLiterally("kind: $.TypeKind.Function")
						c.tsw.WriteLiterallyf(", name: '%s'", typeExpr.Name)

						// Get the underlying signature
						signature := named.Underlying().(*types.Signature)

						// Add params if present
						params := signature.Params()
						if params != nil && params.Len() > 0 {
							c.tsw.WriteLiterally(", params: [")
							for i := 0; i < params.Len(); i++ {
								if i > 0 {
									c.tsw.WriteLiterally(", ")
								}
								// Use basic type info for parameters
								param := params.At(i)
								c.tsw.WriteLiterally("{")
								c.tsw.WriteLiterally("kind: $.TypeKind.Basic, ")

								typeName := param.Type().String()
								if tsType, ok := GoBuiltinToTypescript(typeName); ok {
									c.tsw.WriteLiterallyf("name: '%s'", tsType)
								} else {
									c.tsw.WriteLiterallyf("name: '%s'", typeName)
								}

								c.tsw.WriteLiterally("}")
							}
							c.tsw.WriteLiterally("]")
						}

						// Add results if present
						results := signature.Results()
						if results != nil && results.Len() > 0 {
							c.tsw.WriteLiterally(", results: [")
							for i := 0; i < results.Len(); i++ {
								if i > 0 {
									c.tsw.WriteLiterally(", ")
								}
								result := results.At(i)
								c.tsw.WriteLiterally("{")
								c.tsw.WriteLiterally("kind: $.TypeKind.Basic, ")

								typeName := result.Type().String()
								if tsType, ok := GoBuiltinToTypescript(typeName); ok {
									c.tsw.WriteLiterallyf("name: '%s'", tsType)
								} else {
									c.tsw.WriteLiterallyf("name: '%s'", typeName)
								}

								c.tsw.WriteLiterally("}")
							}
							c.tsw.WriteLiterally("]")
						}

						c.tsw.WriteLiterally("}")
					}
				}
			}

			// Default case for non-function named types
			if !isFunctionType {
				c.tsw.WriteLiterallyf("'%s'", typeExpr.Name)
			}
		}
	case *ast.SelectorExpr:
		// For imported types like pkg.Type
		if ident, ok := typeExpr.X.(*ast.Ident); ok {
			c.tsw.WriteLiterallyf("'%s.%s'", ident.Name, typeExpr.Sel.Name)
		} else {
			c.tsw.WriteLiterallyf("'%s'", c.getTypeNameString(assertedType))
		}
	default:
		// For other types, use the string name as before
		typeName := c.getTypeNameString(assertedType)
		c.tsw.WriteLiterallyf("'%s'", typeName)
	}

	c.tsw.WriteLiterally(")")

	if tok != token.DEFINE || writeEndParen {
		c.tsw.WriteLiterally(")")
	}

	c.tsw.WriteLine("") // Add newline after the statement

	return nil
}
