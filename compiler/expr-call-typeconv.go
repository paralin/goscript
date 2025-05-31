package compiler

import (
	"fmt"
	"go/ast"
	// "go/token" // Not directly used in this file.
	"go/types"
	// "github.com/pkg/errors" // Not directly used in the moved blocks, can add if a deeper dependency arises.
)

// writeTypeConversionExpr handles specific type conversion call expressions,
// such as nil argument conversions and array/slice type conversions like []rune(string).
// It returns true if the expression was handled, false otherwise, and an error if one occurred.
func (c *GoToTSCompiler) writeTypeConversionExpr(exp *ast.CallExpr, expFun ast.Expr) (bool, error) {
	// Handle any type conversion with nil argument
	if len(exp.Args) == 1 {
		if nilIdent, isIdent := exp.Args[0].(*ast.Ident); isIdent && nilIdent.Name == "nil" {
			// Handle nil pointer to struct type conversions: (*struct{})(nil)
			if starExpr, isStarExpr := expFun.(*ast.StarExpr); isStarExpr {
				if _, isStructType := starExpr.X.(*ast.StructType); isStructType {
					c.tsw.WriteLiterally("null")
					return true, nil
				}
			}

			c.tsw.WriteLiterally("null")
			return true, nil
		}
	}

	// Handle array type conversions like []rune(string)
	if arrayType, isArrayType := expFun.(*ast.ArrayType); isArrayType {
		// Check if it's a []rune type
		if ident, isIdent := arrayType.Elt.(*ast.Ident); isIdent && ident.Name == "rune" {
			// Check if the argument is a string
			if len(exp.Args) == 1 {
				arg := exp.Args[0]
				if tv, ok := c.pkg.TypesInfo.Types[arg]; ok && tv.Type != nil {
					if basic, isBasic := tv.Type.Underlying().(*types.Basic); isBasic && basic.Kind() == types.String {
						// Translate []rune(stringValue) to $.stringToRunes(stringValue)
						c.tsw.WriteLiterally("$.stringToRunes(")
						if err := c.WriteValueExpr(arg); err != nil {
							return true, fmt.Errorf("failed to write argument for []rune(string) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return true, nil // Handled []rune(string)
					}
				}
			}
		}
		// Check if it's a []byte type and the argument is a string
		if eltIdent, ok := arrayType.Elt.(*ast.Ident); ok && eltIdent.Name == "byte" && arrayType.Len == nil {
			if len(exp.Args) == 1 {
				arg := exp.Args[0]
				// Ensure TypesInfo is available and the argument type can be determined
				if tv, typeOk := c.pkg.TypesInfo.Types[arg]; typeOk && tv.Type != nil {
					if basicArgType, isBasic := tv.Type.Underlying().(*types.Basic); isBasic && (basicArgType.Info()&types.IsString) != 0 {
						c.tsw.WriteLiterally("$.stringToBytes(")
						if err := c.WriteValueExpr(arg); err != nil {
							return true, fmt.Errorf("failed to write argument for []byte(string) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return true, nil // Handled []byte(string)
					}
				}
			}
		}

		// Handle general slice type conversions like []T(namedType) where namedType has underlying type []T
		if arrayType.Len == nil && len(exp.Args) == 1 {
			arg := exp.Args[0]
			if argType := c.pkg.TypesInfo.TypeOf(arg); argType != nil {
				// Check if the argument is a named type with a slice underlying type
				if namedArgType, isNamed := argType.(*types.Named); isNamed {
					// Check if the named type has receiver methods (is a wrapper class)
					typeName := namedArgType.Obj().Name()
					if c.hasReceiverMethods(typeName) {
						// Check if the underlying type matches the target slice type
						if sliceUnderlying, isSlice := namedArgType.Underlying().(*types.Slice); isSlice {
							// Get the target slice type
							targetType := c.pkg.TypesInfo.TypeOf(arrayType)
							if targetSliceType, isTargetSlice := targetType.Underlying().(*types.Slice); isTargetSlice {
								// Check if element types are compatible
								if types.Identical(sliceUnderlying.Elem(), targetSliceType.Elem()) {
									// This is a conversion from NamedType to []T where NamedType has underlying []T
									// Use valueOf() to get the underlying slice
									if err := c.WriteValueExpr(arg); err != nil {
										return true, fmt.Errorf("failed to write argument for slice type conversion: %w", err)
									}
									c.tsw.WriteLiterally(".valueOf()")
									return true, nil // Handled named type to slice conversion
								}
							}
						}
					}
				}
			}
		}
		// If an arrayType was identified but not handled by the specific cases above,
		// it might be a different kind of array/slice conversion not intended for this function.
		// Return false to indicate it was not handled here.
		// However, the original code implies if it's an arrayType, it's trying to handle it.
		// For safety, if it IS an arrayType but doesn't match the sub-conditions, we consider it "not handled by this function".
		// The calling function can then decide what to do.
		// The original code structure would fall through if none of these specific array conversions matched.
		// So, if it's an arrayType but not handled above, we return (false, nil) to let other logic in WriteCallExpr handle it.
		return false, nil // It was an array type, but not one of the specific conversions above.
	}

	return false, nil // Not a handled type conversion
}
