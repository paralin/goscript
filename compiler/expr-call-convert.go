package compiler

import (
	"fmt"
	"go/ast"
	"go/types"

	"github.com/pkg/errors"
)

func (c *GoToTSCompiler) writeCallExprConvert(exp *ast.CallExpr, funIdent *ast.Ident) error {
	switch funIdent.String() {
	case "nil":
		if len(exp.Args) == 1 {
			argType := c.pkg.TypesInfo.TypeOf(exp.Args[0])
			if argType != nil {
				if _, isArray := argType.Underlying().(*types.Array); isArray {
					c.tsw.WriteLiterally("null")
					return nil
				}
			}
		}
		return errors.New("unhandled nil conversion")
	default:
		if obj := c.pkg.TypesInfo.Uses[funIdent]; obj != nil {
			if typeName, isType := obj.(*types.TypeName); isType {
				if len(exp.Args) == 1 {
					arg := exp.Args[0]
					targetType := typeName.Type()

					if sliceType, isSlice := targetType.Underlying().(*types.Slice); isSlice {
						if basicElem, isBasic := sliceType.Elem().(*types.Basic); isBasic {
							if basicElem.Kind() == types.Int32 {
								if argType := c.pkg.TypesInfo.TypeOf(arg); argType != nil {
									if argBasic, isArgBasic := argType.Underlying().(*types.Basic); isArgBasic && (argBasic.Info()&types.IsString) != 0 {
										c.tsw.WriteLiterally("$.stringToRunes(")
										if err := c.WriteValueExpr(arg); err != nil {
											return fmt.Errorf("failed to write argument for []rune(string) conversion: %w", err)
										}
										c.tsw.WriteLiterally(")")
										return nil
									}
								}
							}
							if basicElem.Kind() == types.Uint8 {
								if argType := c.pkg.TypesInfo.TypeOf(arg); argType != nil {
									if argBasic, isArgBasic := argType.Underlying().(*types.Basic); isArgBasic && (argBasic.Info()&types.IsString) != 0 {
										c.tsw.WriteLiterally("$.stringToBytes(")
										if err := c.WriteValueExpr(arg); err != nil {
											return fmt.Errorf("failed to write argument for []byte(string) conversion: %w", err)
										}
										c.tsw.WriteLiterally(")")
										return nil
									}
								}
							}
						}
					}

					if _, isBasic := targetType.Underlying().(*types.Basic); isBasic {
						if err := c.WriteValueExpr(arg); err != nil {
							return fmt.Errorf("failed to write argument for basic type conversion: %w", err)
						}
						return nil
					}
				}
			}
		}
	}
	return nil
}
