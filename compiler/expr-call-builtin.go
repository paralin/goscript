package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"

	"github.com/pkg/errors"
)

func (c *GoToTSCompiler) writeCallExprBuiltin(exp *ast.CallExpr, funIdent *ast.Ident) error {
	switch funIdent.String() {
	case "panic":
		c.tsw.WriteLiterally("$.panic(")
		if len(exp.Args) == 1 {
			if err := c.WriteValueExpr(exp.Args[0]); err != nil {
				return fmt.Errorf("failed to write panic argument: %w", err)
			}
		} else {
			c.tsw.WriteLiterally("\"panic called\"")
		}
		c.tsw.WriteLiterally(")")
		return nil
	case "println":
		c.tsw.WriteLiterally("console.log(")
		for i, arg := range exp.Args {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write println argument %d: %w", i, err)
			}
		}
		c.tsw.WriteLiterally(")")
		return nil
	case "len":
		if len(exp.Args) != 1 {
			return errors.Errorf("unhandled len call with incorrect number of arguments: %d != 1", len(exp.Args))
		}
		c.tsw.WriteLiterally("$.len(")
		if err := c.WriteValueExpr(exp.Args[0]); err != nil {
			return fmt.Errorf("failed to write len argument: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	case "cap":
		if len(exp.Args) != 1 {
			return errors.Errorf("unhandled cap call with incorrect number of arguments: %d != 1", len(exp.Args))
		}
		c.tsw.WriteLiterally("$.cap(")
		if err := c.WriteValueExpr(exp.Args[0]); err != nil {
			return fmt.Errorf("failed to write cap argument: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	case "delete":
		if len(exp.Args) != 2 {
			return errors.Errorf("unhandled delete call with incorrect number of arguments: %d != 2", len(exp.Args))
		}
		if err := c.WriteValueExpr(exp.Args[0]); err != nil {
			return fmt.Errorf("failed to write map in delete call: %w", err)
		}
		c.tsw.WriteLiterally(".delete(")
		if err := c.WriteValueExpr(exp.Args[1]); err != nil {
			return fmt.Errorf("failed to write key in delete call: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	case "copy":
		if len(exp.Args) != 2 {
			return errors.Errorf("unhandled copy call with incorrect number of arguments: %d != 2", len(exp.Args))
		}
		c.tsw.WriteLiterally("$.copy(")
		if err := c.WriteValueExpr(exp.Args[0]); err != nil {
			return fmt.Errorf("failed to write destination in copy call: %w", err)
		}
		c.tsw.WriteLiterally(", ")
		if err := c.WriteValueExpr(exp.Args[1]); err != nil {
			return fmt.Errorf("failed to write source in copy call: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	case "recover":
		c.tsw.WriteLiterally("$.recover()")
		return nil
	case "new":
		if len(exp.Args) != 1 {
			return errors.Errorf("unhandled new call with incorrect number of arguments: %d != 1", len(exp.Args))
		}
		c.tsw.WriteLiterally("$.new(")
		if err := c.WriteValueExpr(exp.Args[0]); err != nil {
			return fmt.Errorf("failed to write type in new call: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	case "string":
		if len(exp.Args) == 1 {
			arg := exp.Args[0]

			if basicLit, isBasicLit := arg.(*ast.BasicLit); isBasicLit && basicLit.Kind == token.STRING {
				c.WriteBasicLit(basicLit)
				return nil
			}

			innerCall, isCallExpr := arg.(*ast.CallExpr)

			if isCallExpr {
				if innerFunIdent, innerFunIsIdent := innerCall.Fun.(*ast.Ident); innerFunIsIdent && innerFunIdent.String() == "rune" {
					if len(innerCall.Args) == 1 {
						c.tsw.WriteLiterally("$.runeOrStringToString(")
						if err := c.WriteValueExpr(innerCall.Args[0]); err != nil {
							return fmt.Errorf("failed to write argument for string(rune) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return nil
					}
				}
			}

			if tv, ok := c.pkg.TypesInfo.Types[arg]; ok {
				if basic, isBasic := tv.Type.Underlying().(*types.Basic); isBasic && basic.Kind() == types.String {
					if err := c.WriteValueExpr(arg); err != nil {
						return fmt.Errorf("failed to write argument for string(string) no-op conversion: %w", err)
					}
					return nil
				}

				if basic, isBasic := tv.Type.Underlying().(*types.Basic); isBasic && (basic.Kind() == types.Int32 || basic.Kind() == types.UntypedRune) {
					c.tsw.WriteLiterally("$.runeOrStringToString(")
					if err := c.WriteValueExpr(arg); err != nil {
						return fmt.Errorf("failed to write argument for string(int32) conversion: %w", err)
					}
					c.tsw.WriteLiterally(")")
					return nil
				}

				if sliceType, isSlice := tv.Type.Underlying().(*types.Slice); isSlice {
					if basic, isBasic := sliceType.Elem().Underlying().(*types.Basic); isBasic {
						if basic.Kind() == types.Uint8 {
							c.tsw.WriteLiterally("$.bytesToString(")
							if err := c.WriteValueExpr(arg); err != nil {
								return fmt.Errorf("failed to write argument for string([]byte) conversion: %w", err)
							}
							c.tsw.WriteLiterally(")")
							return nil
						}
						if basic.Kind() == types.Int32 {
							c.tsw.WriteLiterally("$.runesToString(")
							if err := c.WriteValueExpr(arg); err != nil {
								return fmt.Errorf("failed to write argument for string([]rune) conversion: %w", err)
							}
							c.tsw.WriteLiterally(")")
							return nil
						}
					}
				}

				if typeParam, isTypeParam := tv.Type.(*types.TypeParam); isTypeParam {
					constraint := typeParam.Constraint()
					if constraint != nil {
						c.tsw.WriteLiterally("$.genericBytesOrStringToString(")
						if err := c.WriteValueExpr(arg); err != nil {
							return fmt.Errorf("failed to write argument for string(generic) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return nil
					}
				}
			}
		}
		return fmt.Errorf("unhandled string conversion: %s", exp.Fun)
	case "close":
		if len(exp.Args) == 1 {
			if err := c.WriteValueExpr(exp.Args[0]); err != nil {
				return fmt.Errorf("failed to write channel in close call: %w", err)
			}
			c.tsw.WriteLiterally(".close()")
			return nil
		}
		return errors.New("unhandled close call with incorrect number of arguments")
	case "append":
		if len(exp.Args) >= 1 {
			c.tsw.WriteLiterally("$.append(")
			if err := c.WriteValueExpr(exp.Args[0]); err != nil {
				return fmt.Errorf("failed to write slice in append call: %w", err)
			}
			for i, arg := range exp.Args[1:] {
				if i > 0 || len(exp.Args) > 1 {
					c.tsw.WriteLiterally(", ")
				}

				if exp.Ellipsis != token.NoPos && i == 0 {
					sliceType := c.pkg.TypesInfo.TypeOf(exp.Args[0])
					argType := c.pkg.TypesInfo.TypeOf(arg)

					if sliceType != nil && argType != nil {
						isSliceOfBytes := false
						if sliceUnder, ok := sliceType.Underlying().(*types.Slice); ok {
							if basicElem, ok := sliceUnder.Elem().(*types.Basic); ok && basicElem.Kind() == types.Uint8 {
								isSliceOfBytes = true
							}
						}

						isArgString := false
						if basicArg, ok := argType.Underlying().(*types.Basic); ok && (basicArg.Kind() == types.String || basicArg.Kind() == types.UntypedString) {
							isArgString = true
						}

						if isSliceOfBytes && isArgString {
							c.tsw.WriteLiterally("...$.stringToBytes(")
							if err := c.WriteValueExpr(arg); err != nil {
								return fmt.Errorf("failed to write string argument in append call: %w", err)
							}
							c.tsw.WriteLiterally(")")
							continue
						}
					}
				}

				if err := c.WriteValueExpr(arg); err != nil {
					return fmt.Errorf("failed to write argument %d in append call: %w", i+1, err)
				}
			}
			c.tsw.WriteLiterally(")")
			return nil
		}
		return errors.New("unhandled append call with incorrect number of arguments")
	case "byte":
		if len(exp.Args) != 1 {
			return errors.Errorf("unhandled byte call with incorrect number of arguments: %d != 1", len(exp.Args))
		}
		c.tsw.WriteLiterally("$.byte(")
		if err := c.WriteValueExpr(exp.Args[0]); err != nil {
			return fmt.Errorf("failed to write argument for byte() conversion: %w", err)
		}
		c.tsw.WriteLiterally(")")
		return nil
	case "int":
		if len(exp.Args) == 1 {
			arg := exp.Args[0]

			if argType := c.pkg.TypesInfo.TypeOf(arg); argType != nil {
				if namedArgType, isNamed := argType.(*types.Named); isNamed {
					argTypeName := namedArgType.Obj().Name()
					if c.hasReceiverMethods(argTypeName) {
						if types.Identical(types.Typ[types.Int], namedArgType.Underlying()) {
							if err := c.WriteValueExpr(arg); err != nil {
								return fmt.Errorf("failed to write argument for valueOf conversion: %w", err)
							}
							c.tsw.WriteLiterally(".valueOf()")
							return nil
						}
					}
				}
			}

			c.tsw.WriteLiterally("$.int(")
			if err := c.WriteValueExpr(exp.Args[0]); err != nil {
				return fmt.Errorf("failed to write argument for int() conversion: %w", err)
			}
			c.tsw.WriteLiterally(")")
			return nil
		}
		return fmt.Errorf("unhandled int conversion with incorrect number of arguments: %d != 1", len(exp.Args))
	default:
		return nil
	}
}
