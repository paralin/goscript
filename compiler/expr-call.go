package compiler

import (
	"fmt"
	"go/ast"
	"go/types"
)

func (c *GoToTSCompiler) WriteCallExpr(exp *ast.CallExpr) error {
	expFun := exp.Fun

	if selExpr, ok := expFun.(*ast.SelectorExpr); ok {
		if xIdent, ok := selExpr.X.(*ast.Ident); ok {
			if obj := c.pkg.TypesInfo.Uses[xIdent]; obj != nil {
				if varObj, isVar := obj.(*types.Var); isVar {
					varType := varObj.Type()
					if ptrType, isPtr := varType.(*types.Pointer); isPtr {
						if namedType, isNamed := ptrType.Elem().(*types.Named); isNamed {
							typeName := namedType.Obj().Name()
							pkgPath := namedType.Obj().Pkg().Path()

							if pkgPath == "google.golang.org/protobuf/types/known/timestamppb" && typeName == "Timestamp" {
								methodName := selExpr.Sel.Name
								switch methodName {
								case "AsTime":
									c.tsw.WriteLiterally("new Date((")
									if err := c.WriteValueExpr(selExpr.X); err != nil {
										return fmt.Errorf("failed to write timestamp receiver: %w", err)
									}
									c.tsw.WriteLiterally(".seconds || 0) * 1000 + (")
									if err := c.WriteValueExpr(selExpr.X); err != nil {
										return fmt.Errorf("failed to write timestamp receiver: %w", err)
									}
									c.tsw.WriteLiterally(".nanos || 0) / 1000000)")
									return nil
								}
							}

							if pkgPath == "google.golang.org/protobuf/types/known/durationpb" && typeName == "Duration" {
								methodName := selExpr.Sel.Name
								switch methodName {
								case "AsDuration":
									c.tsw.WriteLiterally("((")
									if err := c.WriteValueExpr(selExpr.X); err != nil {
										return fmt.Errorf("failed to write duration receiver: %w", err)
									}
									c.tsw.WriteLiterally(".seconds || 0) * 1000 + (")
									if err := c.WriteValueExpr(selExpr.X); err != nil {
										return fmt.Errorf("failed to write duration receiver: %w", err)
									}
									c.tsw.WriteLiterally(".nanos || 0) / 1000000)")
									return nil
								}
							}
						}
					}
				}
			}
		}

		if c.pkg.TypesInfo.TypeOf(selExpr.X) != nil {
			receiverType := c.pkg.TypesInfo.TypeOf(selExpr.X)
			if ptrType, isPtr := receiverType.(*types.Pointer); isPtr {
				if _, isNamed := ptrType.Elem().(*types.Named); isNamed {
					c.tsw.WriteLiterally("(")
					if err := c.WriteValueExpr(selExpr.X); err != nil {
						return fmt.Errorf("failed to write pointer receiver: %w", err)
					}
					c.tsw.WriteLiterally(" as any)?.")
					c.tsw.WriteLiterally(selExpr.Sel.Name)
					c.tsw.WriteLiterally("?.(")
					for i, arg := range exp.Args {
						if i > 0 {
							c.tsw.WriteLiterally(", ")
						}
						if err := c.WriteValueExpr(arg); err != nil {
							return fmt.Errorf("failed to write argument %d in nil-safe method call: %w", i, err)
						}
					}
					c.tsw.WriteLiterally(")")
					return nil
				}
			}
		}
	}

	if arrayType, ok := expFun.(*ast.ArrayType); ok {
		if len(exp.Args) == 1 {
			if ident, ok := exp.Args[0].(*ast.Ident); ok && ident.Name == "nil" {
				c.tsw.WriteLiterally("null")
				return nil
			}
			
			if typ := c.pkg.TypesInfo.TypeOf(arrayType); typ != nil {
				if sliceType, isSlice := typ.Underlying().(*types.Slice); isSlice {
					if basicElem, isBasic := sliceType.Elem().(*types.Basic); isBasic {
						if basicElem.Kind() == types.Uint8 {
							if argType := c.pkg.TypesInfo.TypeOf(exp.Args[0]); argType != nil {
								if argBasic, isArgBasic := argType.Underlying().(*types.Basic); isArgBasic && (argBasic.Info()&types.IsString) != 0 {
									c.tsw.WriteLiterally("$.stringToBytes(")
									if err := c.WriteValueExpr(exp.Args[0]); err != nil {
										return fmt.Errorf("failed to write argument for []byte(string) conversion: %w", err)
									}
									c.tsw.WriteLiterally(")")
									return nil
								}
							}
						}
						if basicElem.Kind() == types.Int32 {
							if argType := c.pkg.TypesInfo.TypeOf(exp.Args[0]); argType != nil {
								if argBasic, isArgBasic := argType.Underlying().(*types.Basic); isArgBasic && (argBasic.Info()&types.IsString) != 0 {
									c.tsw.WriteLiterally("$.stringToRunes(")
									if err := c.WriteValueExpr(exp.Args[0]); err != nil {
										return fmt.Errorf("failed to write argument for []rune(string) conversion: %w", err)
									}
									c.tsw.WriteLiterally(")")
									return nil
								}
							}
						}
					}
				}
			}
		}
	}

	if funIdent, ok := expFun.(*ast.Ident); ok {
		switch funIdent.String() {
		case "panic", "println", "len", "cap", "delete", "copy", "recover", "new", "string", "close", "append", "byte", "int":
			return c.writeCallExprBuiltin(exp, funIdent)
		case "make":
			return c.writeCallExprMake(exp)
		case "nil":
			return c.writeCallExprConvert(exp, funIdent)
		default:
			if obj := c.pkg.TypesInfo.Uses[funIdent]; obj != nil {
				if _, isType := obj.(*types.TypeName); isType {
					return c.writeCallExprConvert(exp, funIdent)
				}
			}
		}
	}

	if err := c.WriteValueExpr(expFun); err != nil {
		return fmt.Errorf("failed to write function expression: %w", err)
	}

	c.tsw.WriteLiterally("(")
	for i, arg := range exp.Args {
		if i > 0 {
			c.tsw.WriteLiterally(", ")
		}
		if err := c.WriteValueExpr(arg); err != nil {
			return fmt.Errorf("failed to write argument %d in function call: %w", i, err)
		}
	}
	c.tsw.WriteLiterally(")")
	return nil
}
