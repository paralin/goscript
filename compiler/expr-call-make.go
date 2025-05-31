package compiler

import (
	"fmt"
	"go/ast"
	"go/types"

	"github.com/pkg/errors"
)

func (c *GoToTSCompiler) writeCallExprMake(exp *ast.CallExpr) error {
	if len(exp.Args) < 1 {
		return errors.New("make requires at least one argument")
	}

	if mapType, ok := exp.Args[0].(*ast.MapType); ok {
		if typ := c.pkg.TypesInfo.TypeOf(mapType); typ != nil {
			if mapTypeInfo, isMap := typ.Underlying().(*types.Map); isMap {
				c.tsw.WriteLiterally("$.makeMap<")
				c.WriteGoType(mapTypeInfo.Key(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(", ")
				c.WriteGoType(mapTypeInfo.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">()")
				return nil
			}
		}
	}

	if chanType, ok := exp.Args[0].(*ast.ChanType); ok {
		if typ := c.pkg.TypesInfo.TypeOf(chanType); typ != nil {
			if chanTypeInfo, isChan := typ.Underlying().(*types.Chan); isChan {
				c.tsw.WriteLiterally("$.makeChannel<")
				c.WriteGoType(chanTypeInfo.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">(")

				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil {
						return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
					}
				} else {
					c.tsw.WriteLiterally("0")
				}

				c.tsw.WriteLiterally(", ")

				if chanTypeInfo.Elem().String() == "struct{}" {
					c.tsw.WriteLiterally("{}")
				} else {
					c.WriteZeroValueForType(chanTypeInfo.Elem())
				}

				c.tsw.WriteLiterally(", ")

				switch chanTypeInfo.Dir() {
				case types.SendRecv:
					c.tsw.WriteLiterally("'both'")
				case types.SendOnly:
					c.tsw.WriteLiterally("'send'")
				case types.RecvOnly:
					c.tsw.WriteLiterally("'receive'")
				default:
					c.tsw.WriteLiterally("'both'")
				}

				c.tsw.WriteLiterally(")")
				return nil
			}
		}
	}

	if arrayType, ok := exp.Args[0].(*ast.ArrayType); ok {
		if typ := c.pkg.TypesInfo.TypeOf(arrayType); typ != nil {
			underlying := typ.Underlying()

			if sliceType, isSlice := underlying.(*types.Slice); isSlice {
				goElemType := sliceType.Elem()

				if basicElem, isBasic := goElemType.(*types.Basic); isBasic && basicElem.Kind() == types.Uint8 {
					if len(exp.Args) == 3 {
						c.tsw.WriteLiterally("$.makeSlice<number>(")
						if err := c.WriteValueExpr(exp.Args[1]); err != nil {
							return err
						}
						c.tsw.WriteLiterally(", ")
						if err := c.WriteValueExpr(exp.Args[2]); err != nil {
							return err
						}
						c.tsw.WriteLiterally(", 'byte')")
					} else {
						c.tsw.WriteLiterally("new Uint8Array(")
						if len(exp.Args) >= 2 {
							if err := c.WriteValueExpr(exp.Args[1]); err != nil {
								return err
							}
						} else {
							c.tsw.WriteLiterally("0")
						}
						c.tsw.WriteLiterally(")")
					}
					return nil
				}

				c.tsw.WriteLiterally("$.makeSlice<")
				c.WriteGoType(goElemType, GoTypeContextGeneral)
				c.tsw.WriteLiterally(">(")

				hasCapacity := len(exp.Args) == 3

				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil {
						return err
					}
					if hasCapacity {
						c.tsw.WriteLiterally(", ")
						if err := c.WriteValueExpr(exp.Args[2]); err != nil {
							return err
						}
					} else if len(exp.Args) > 3 {
						return errors.New("makeSlice expects 2 or 3 arguments")
					}
				} else {
					c.tsw.WriteLiterally("0")
				}

				typeHint := c.getTypeHintForSliceElement(goElemType)
				if typeHint != "" {
					if !hasCapacity {
						c.tsw.WriteLiterally(", undefined")
					}
					c.tsw.WriteLiterally(", '")
					c.tsw.WriteLiterally(typeHint)
					c.tsw.WriteLiterally("'")
				}

				c.tsw.WriteLiterally(")")
				return nil
			}

			if mapType, isMap := underlying.(*types.Map); isMap {
				c.tsw.WriteLiterally("$.makeMap<")
				c.WriteGoType(mapType.Key(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(", ")
				c.WriteGoType(mapType.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">()")
				return nil
			}

			if chanType, isChan := underlying.(*types.Chan); isChan {
				c.tsw.WriteLiterally("$.makeChannel<")
				c.WriteGoType(chanType.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">(")

				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil {
						return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
					}
				} else {
					c.tsw.WriteLiterally("0")
				}

				c.tsw.WriteLiterally(", ")

				if chanType.Elem().String() == "struct{}" {
					c.tsw.WriteLiterally("{}")
				} else {
					c.WriteZeroValueForType(chanType.Elem())
				}

				c.tsw.WriteLiterally(", ")

				switch chanType.Dir() {
				case types.SendRecv:
					c.tsw.WriteLiterally("'both'")
				case types.SendOnly:
					c.tsw.WriteLiterally("'send'")
				case types.RecvOnly:
					c.tsw.WriteLiterally("'receive'")
				default:
					c.tsw.WriteLiterally("'both'")
				}

				c.tsw.WriteLiterally(")")
				return nil
			}
		}
	}

	if ident, ok := exp.Args[0].(*ast.Ident); ok {
		if obj := c.pkg.TypesInfo.Uses[ident]; obj != nil {
			if typeName, isType := obj.(*types.TypeName); isType {
				underlyingType := typeName.Type().Underlying()

				if chanType, isChan := underlyingType.(*types.Chan); isChan {
					c.tsw.WriteLiterally("$.makeChannel<")
					c.WriteGoType(chanType.Elem(), GoTypeContextGeneral)
					c.tsw.WriteLiterally(">(")

					if len(exp.Args) >= 2 {
						if err := c.WriteValueExpr(exp.Args[1]); err != nil {
							return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
						}
					} else {
						c.tsw.WriteLiterally("0")
					}

					c.tsw.WriteLiterally(", ")

					if chanType.Elem().String() == "struct{}" {
						c.tsw.WriteLiterally("{}")
					} else {
						c.WriteZeroValueForType(chanType.Elem())
					}

					c.tsw.WriteLiterally(", ")

					switch chanType.Dir() {
					case types.SendRecv:
						c.tsw.WriteLiterally("'both'")
					case types.SendOnly:
						c.tsw.WriteLiterally("'send'")
					case types.RecvOnly:
						c.tsw.WriteLiterally("'receive'")
					default:
						c.tsw.WriteLiterally("'both'")
					}

					c.tsw.WriteLiterally(")")
					return nil
				}

				if mapType, isMap := underlyingType.(*types.Map); isMap {
					c.tsw.WriteLiterally("$.makeMap<")
					c.WriteGoType(mapType.Key(), GoTypeContextGeneral)
					c.tsw.WriteLiterally(", ")
					c.WriteGoType(mapType.Elem(), GoTypeContextGeneral)
					c.tsw.WriteLiterally(">()")
					return nil
				}

				if sliceType, isSlice := underlyingType.(*types.Slice); isSlice {
					elemType := sliceType.Elem()

					if basicElem, isBasic := elemType.(*types.Basic); isBasic && basicElem.Kind() == types.Uint8 {
						if len(exp.Args) == 3 {
							c.tsw.WriteLiterally("$.makeSlice<number>(")
							if err := c.WriteValueExpr(exp.Args[1]); err != nil {
								return err
							}
							c.tsw.WriteLiterally(", ")
							if err := c.WriteValueExpr(exp.Args[2]); err != nil {
								return err
							}
							c.tsw.WriteLiterally(", 'byte')")
						} else {
							c.tsw.WriteLiterally("new Uint8Array(")
							if len(exp.Args) >= 2 {
								if err := c.WriteValueExpr(exp.Args[1]); err != nil {
									return err
								}
							} else {
								c.tsw.WriteLiterally("0")
							}
							c.tsw.WriteLiterally(")")
						}
						return nil
					}

					if typeParam, isTypeParam := elemType.(*types.TypeParam); isTypeParam {
						constraint := typeParam.Constraint()
						if constraint != nil {
							underlying := constraint.Underlying()
							if iface, isInterface := underlying.(*types.Interface); isInterface {
								if c.hasSliceConstraint(iface) {
									elemType := c.getSliceElementTypeFromConstraint(iface)
									if elemType != nil {
										if basicElem, isBasic := elemType.(*types.Basic); isBasic && basicElem.Kind() == types.Uint8 {
											if len(exp.Args) == 3 {
												c.tsw.WriteLiterally("$.makeSlice<number>(")
												if err := c.WriteValueExpr(exp.Args[1]); err != nil {
													return err
												}
												c.tsw.WriteLiterally(", ")
												if err := c.WriteValueExpr(exp.Args[2]); err != nil {
													return err
												}
												c.tsw.WriteLiterally(", 'byte')")
											} else {
												c.tsw.WriteLiterally("new Uint8Array(")
												if len(exp.Args) >= 2 {
													if err := c.WriteValueExpr(exp.Args[1]); err != nil {
														return err
													}
												} else {
													c.tsw.WriteLiterally("0")
												}
												c.tsw.WriteLiterally(")")
											}
											return nil
										}

										c.tsw.WriteLiterally("$.makeSlice<")
										c.WriteGoType(elemType, GoTypeContextGeneral)
										c.tsw.WriteLiterally(">(")

										hasCapacity := len(exp.Args) == 3

										if len(exp.Args) >= 2 {
											if err := c.WriteValueExpr(exp.Args[1]); err != nil {
												return err
											}
											if hasCapacity {
												c.tsw.WriteLiterally(", ")
												if err := c.WriteValueExpr(exp.Args[2]); err != nil {
													return err
												}
											} else if len(exp.Args) > 3 {
												return errors.New("makeSlice expects 2 or 3 arguments")
											}
										} else {
											c.tsw.WriteLiterally("0")
										}

										typeHint := c.getTypeHintForSliceElement(elemType)
										if typeHint != "" {
											if !hasCapacity {
												c.tsw.WriteLiterally(", undefined")
											}
											c.tsw.WriteLiterally(", '")
											c.tsw.WriteLiterally(typeHint)
											c.tsw.WriteLiterally("'")
										}

										c.tsw.WriteLiterally(")")
										return nil
									}
								}
							}
						}
					}

					c.tsw.WriteLiterally("$.makeSlice<")
					c.WriteGoType(elemType, GoTypeContextGeneral)
					c.tsw.WriteLiterally(">(")

					hasCapacity := len(exp.Args) == 3

					if len(exp.Args) >= 2 {
						if err := c.WriteValueExpr(exp.Args[1]); err != nil {
							return err
						}
						if hasCapacity {
							c.tsw.WriteLiterally(", ")
							if err := c.WriteValueExpr(exp.Args[2]); err != nil {
								return err
							}
						} else if len(exp.Args) > 3 {
							return errors.New("makeSlice expects 2 or 3 arguments")
						}
					} else {
						c.tsw.WriteLiterally("0")
					}

					typeHint := c.getTypeHintForSliceElement(elemType)
					if typeHint != "" {
						if !hasCapacity {
							c.tsw.WriteLiterally(", undefined")
						}
						c.tsw.WriteLiterally(", '")
						c.tsw.WriteLiterally(typeHint)
						c.tsw.WriteLiterally("'")
					}

					c.tsw.WriteLiterally(")")
					return nil
				}
			} else {
				namedType := typeName.Type()
				if sliceType, isSlice := namedType.Underlying().(*types.Slice); isSlice {
					goElemType := sliceType.Elem()

					if basicElem, isBasic := goElemType.(*types.Basic); isBasic && basicElem.Kind() == types.Uint8 {
						if len(exp.Args) == 3 {
							c.tsw.WriteLiterally("$.makeSlice<number>(")
							if err := c.WriteValueExpr(exp.Args[1]); err != nil {
								return err
							}
							c.tsw.WriteLiterally(", ")
							if err := c.WriteValueExpr(exp.Args[2]); err != nil {
								return err
							}
							c.tsw.WriteLiterally(", 'byte')")
						} else {
							c.tsw.WriteLiterally("new Uint8Array(")
							if len(exp.Args) >= 2 {
								if err := c.WriteValueExpr(exp.Args[1]); err != nil {
									return err
								}
							} else {
								c.tsw.WriteLiterally("0")
							}
							c.tsw.WriteLiterally(")")
						}
						return nil
					}

					c.tsw.WriteLiterally("$.makeSlice<")
					c.WriteGoType(goElemType, GoTypeContextGeneral)
					c.tsw.WriteLiterally(">(")

					hasCapacity := len(exp.Args) == 3

					if len(exp.Args) >= 2 {
						if err := c.WriteValueExpr(exp.Args[1]); err != nil {
							return err
						}
						if hasCapacity {
							c.tsw.WriteLiterally(", ")
							if err := c.WriteValueExpr(exp.Args[2]); err != nil {
								return err
							}
						} else if len(exp.Args) > 3 {
							return errors.New("makeSlice expects 2 or 3 arguments")
						}
					} else {
						c.tsw.WriteLiterally("0")
					}

					typeHint := c.getTypeHintForSliceElement(goElemType)
					if typeHint != "" {
						if !hasCapacity {
							c.tsw.WriteLiterally(", undefined")
						}
						c.tsw.WriteLiterally(", '")
						c.tsw.WriteLiterally(typeHint)
						c.tsw.WriteLiterally("'")
					}

					c.tsw.WriteLiterally(")")
					return nil
				}

				if mapType, isMap := namedType.Underlying().(*types.Map); isMap {
					c.tsw.WriteLiterally("$.makeMap<")
					c.WriteGoType(mapType.Key(), GoTypeContextGeneral)
					c.tsw.WriteLiterally(", ")
					c.WriteGoType(mapType.Elem(), GoTypeContextGeneral)
					c.tsw.WriteLiterally(">()")
					return nil
				}

				if chanType, isChan := namedType.Underlying().(*types.Chan); isChan {
					c.tsw.WriteLiterally("$.makeChannel<")
					c.WriteGoType(chanType.Elem(), GoTypeContextGeneral)
					c.tsw.WriteLiterally(">(")

					if len(exp.Args) >= 2 {
						if err := c.WriteValueExpr(exp.Args[1]); err != nil {
							return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
						}
					} else {
						c.tsw.WriteLiterally("0")
					}

					c.tsw.WriteLiterally(", ")

					if chanType.Elem().String() == "struct{}" {
						c.tsw.WriteLiterally("{}")
					} else {
						c.WriteZeroValueForType(chanType.Elem())
					}

					c.tsw.WriteLiterally(", ")

					switch chanType.Dir() {
					case types.SendRecv:
						c.tsw.WriteLiterally("'both'")
					case types.SendOnly:
						c.tsw.WriteLiterally("'send'")
					case types.RecvOnly:
						c.tsw.WriteLiterally("'receive'")
					default:
						c.tsw.WriteLiterally("'both'")
					}

					c.tsw.WriteLiterally(")")
					return nil
				}
			}
		}
	}

	if indexExpr, ok := exp.Args[0].(*ast.IndexExpr); ok {
		if typ := c.pkg.TypesInfo.TypeOf(indexExpr); typ != nil {
			underlying := typ.Underlying()

			if mapType, isMap := underlying.(*types.Map); isMap {
				c.tsw.WriteLiterally("$.makeMap<")
				c.WriteGoType(mapType.Key(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(", ")
				c.WriteGoType(mapType.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">()")
				return nil
			}

			if sliceType, isSlice := underlying.(*types.Slice); isSlice {
				goElemType := sliceType.Elem()

				if basicElem, isBasic := goElemType.(*types.Basic); isBasic && basicElem.Kind() == types.Uint8 {
					if len(exp.Args) == 3 {
						c.tsw.WriteLiterally("$.makeSlice<number>(")
						if err := c.WriteValueExpr(exp.Args[1]); err != nil {
							return err
						}
						c.tsw.WriteLiterally(", ")
						if err := c.WriteValueExpr(exp.Args[2]); err != nil {
							return err
						}
						c.tsw.WriteLiterally(", 'byte')")
					} else {
						c.tsw.WriteLiterally("new Uint8Array(")
						if len(exp.Args) >= 2 {
							if err := c.WriteValueExpr(exp.Args[1]); err != nil {
								return err
							}
						} else {
							c.tsw.WriteLiterally("0")
						}
						c.tsw.WriteLiterally(")")
					}
					return nil
				}

				c.tsw.WriteLiterally("$.makeSlice<")
				c.WriteGoType(goElemType, GoTypeContextGeneral)
				c.tsw.WriteLiterally(">(")

				hasCapacity := len(exp.Args) == 3

				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil {
						return err
					}
					if hasCapacity {
						c.tsw.WriteLiterally(", ")
						if err := c.WriteValueExpr(exp.Args[2]); err != nil {
							return err
						}
					} else if len(exp.Args) > 3 {
						return errors.New("makeSlice expects 2 or 3 arguments")
					}
				} else {
					c.tsw.WriteLiterally("0")
				}

				typeHint := c.getTypeHintForSliceElement(goElemType)
				if typeHint != "" {
					if !hasCapacity {
						c.tsw.WriteLiterally(", undefined")
					}
					c.tsw.WriteLiterally(", '")
					c.tsw.WriteLiterally(typeHint)
					c.tsw.WriteLiterally("'")
				}

				c.tsw.WriteLiterally(")")
				return nil
			}

			if chanType, isChan := underlying.(*types.Chan); isChan {
				c.tsw.WriteLiterally("$.makeChannel<")
				c.WriteGoType(chanType.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">(")

				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil {
						return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
					}
				} else {
					c.tsw.WriteLiterally("0")
				}

				c.tsw.WriteLiterally(", ")

				if chanType.Elem().String() == "struct{}" {
					c.tsw.WriteLiterally("{}")
				} else {
					c.WriteZeroValueForType(chanType.Elem())
				}

				c.tsw.WriteLiterally(", ")

				switch chanType.Dir() {
				case types.SendRecv:
					c.tsw.WriteLiterally("'both'")
				case types.SendOnly:
					c.tsw.WriteLiterally("'send'")
				case types.RecvOnly:
					c.tsw.WriteLiterally("'receive'")
				default:
					c.tsw.WriteLiterally("'both'")
				}

				c.tsw.WriteLiterally(")")
				return nil
			}
		}
	}

	if selectorExpr, ok := exp.Args[0].(*ast.SelectorExpr); ok {
		if typ := c.pkg.TypesInfo.TypeOf(selectorExpr); typ != nil {
			underlying := typ.Underlying()

			if mapType, isMap := underlying.(*types.Map); isMap {
				c.tsw.WriteLiterally("$.makeMap<")
				c.WriteGoType(mapType.Key(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(", ")
				c.WriteGoType(mapType.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">()")
				return nil
			}

			if sliceType, isSlice := underlying.(*types.Slice); isSlice {
				goElemType := sliceType.Elem()

				if basicElem, isBasic := goElemType.(*types.Basic); isBasic && basicElem.Kind() == types.Uint8 {
					if len(exp.Args) == 3 {
						c.tsw.WriteLiterally("$.makeSlice<number>(")
						if err := c.WriteValueExpr(exp.Args[1]); err != nil {
							return err
						}
						c.tsw.WriteLiterally(", ")
						if err := c.WriteValueExpr(exp.Args[2]); err != nil {
							return err
						}
						c.tsw.WriteLiterally(", 'byte')")
					} else {
						c.tsw.WriteLiterally("new Uint8Array(")
						if len(exp.Args) >= 2 {
							if err := c.WriteValueExpr(exp.Args[1]); err != nil {
								return err
							}
						} else {
							c.tsw.WriteLiterally("0")
						}
						c.tsw.WriteLiterally(")")
					}
					return nil
				}

				c.tsw.WriteLiterally("$.makeSlice<")
				c.WriteGoType(goElemType, GoTypeContextGeneral)
				c.tsw.WriteLiterally(">(")

				hasCapacity := len(exp.Args) == 3

				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil {
						return err
					}
					if hasCapacity {
						c.tsw.WriteLiterally(", ")
						if err := c.WriteValueExpr(exp.Args[2]); err != nil {
							return err
						}
					} else if len(exp.Args) > 3 {
						return errors.New("makeSlice expects 2 or 3 arguments")
					}
				} else {
					c.tsw.WriteLiterally("0")
				}

				typeHint := c.getTypeHintForSliceElement(goElemType)
				if typeHint != "" {
					if !hasCapacity {
						c.tsw.WriteLiterally(", undefined")
					}
					c.tsw.WriteLiterally(", '")
					c.tsw.WriteLiterally(typeHint)
					c.tsw.WriteLiterally("'")
				}

				c.tsw.WriteLiterally(")")
				return nil
			}

			if chanType, isChan := underlying.(*types.Chan); isChan {
				c.tsw.WriteLiterally("$.makeChannel<")
				c.WriteGoType(chanType.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">(")

				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil {
						return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
					}
				} else {
					c.tsw.WriteLiterally("0")
				}

				c.tsw.WriteLiterally(", ")

				if chanType.Elem().String() == "struct{}" {
					c.tsw.WriteLiterally("{}")
				} else {
					c.WriteZeroValueForType(chanType.Elem())
				}

				c.tsw.WriteLiterally(", ")

				switch chanType.Dir() {
				case types.SendRecv:
					c.tsw.WriteLiterally("'both'")
				case types.SendOnly:
					c.tsw.WriteLiterally("'send'")
				case types.RecvOnly:
					c.tsw.WriteLiterally("'receive'")
				default:
					c.tsw.WriteLiterally("'both'")
				}

				c.tsw.WriteLiterally(")")
				return nil
			}
		}
	}

	return errors.New("unhandled make call")
}

func (c *GoToTSCompiler) hasSliceConstraint(iface *types.Interface) bool {
	for i := 0; i < iface.NumEmbeddeds(); i++ {
		embedded := iface.EmbeddedType(i)
		if union, ok := embedded.(*types.Union); ok {
			for j := 0; j < union.Len(); j++ {
				term := union.Term(j)
				if _, isSlice := term.Type().Underlying().(*types.Slice); isSlice {
					return true
				}
			}
		} else if _, isSlice := embedded.Underlying().(*types.Slice); isSlice {
			return true
		}
	}
	return false
}

func (c *GoToTSCompiler) getSliceElementTypeFromConstraint(iface *types.Interface) types.Type {
	for i := 0; i < iface.NumEmbeddeds(); i++ {
		embedded := iface.EmbeddedType(i)
		if union, ok := embedded.(*types.Union); ok {
			for j := 0; j < union.Len(); j++ {
				term := union.Term(j)
				if sliceType, isSlice := term.Type().Underlying().(*types.Slice); isSlice {
					return sliceType.Elem()
				}
			}
		} else if sliceType, isSlice := embedded.Underlying().(*types.Slice); isSlice {
			return sliceType.Elem()
		}
	}
	return nil
}

func (c *GoToTSCompiler) hasMixedStringByteConstraint(iface *types.Interface) bool {
	hasString := false
	hasByteSlice := false

	for i := 0; i < iface.NumEmbeddeds(); i++ {
		embedded := iface.EmbeddedType(i)
		if union, ok := embedded.(*types.Union); ok {
			for j := 0; j < union.Len(); j++ {
				term := union.Term(j)
				termType := term.Type().Underlying()

				if basicType, isBasic := termType.(*types.Basic); isBasic && (basicType.Info()&types.IsString) != 0 {
					hasString = true
				}

				if sliceType, isSlice := termType.(*types.Slice); isSlice {
					if elemType, isBasic := sliceType.Elem().(*types.Basic); isBasic && elemType.Kind() == types.Uint8 {
						hasByteSlice = true
					}
				}
			}
		} else {
			termType := embedded.Underlying()

			if basicType, isBasic := termType.(*types.Basic); isBasic && (basicType.Info()&types.IsString) != 0 {
				hasString = true
			}

			if sliceType, isSlice := termType.(*types.Slice); isSlice {
				if elemType, isBasic := sliceType.Elem().(*types.Basic); isBasic && elemType.Kind() == types.Uint8 {
					hasByteSlice = true
				}
			}
		}
	}

	return hasString && hasByteSlice
}

func (c *GoToTSCompiler) getTypeHintForSliceElement(elemType types.Type) string {
	if basicType, isBasic := elemType.(*types.Basic); isBasic {
		switch basicType.Kind() {
		case types.Int, types.Int8, types.Int16, types.Int32, types.Int64,
			types.Uint, types.Uint8, types.Uint16, types.Uint32, types.Uint64,
			types.Float32, types.Float64, types.Complex64, types.Complex128:
			return "number"
		case types.Bool:
			return "boolean"
		case types.String:
			return "string"
		}
	}
	return ""
}
