package compiler

import (
	"fmt"
	"go/ast"
	"go/types"

	"github.com/pkg/errors"
)

// hasSliceConstraint checks if an interface constraint includes slice types
// For constraints like ~[]E, this returns true
func hasSliceConstraint(iface *types.Interface) bool {
	// Check if the interface has type terms that include slice types
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

// getSliceElementTypeFromConstraint extracts the element type from a slice constraint
// For constraints like ~[]E, this returns E
func getSliceElementTypeFromConstraint(iface *types.Interface) types.Type {
	// Check if the interface has type terms that include slice types
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

// hasMixedStringByteConstraint checks if an interface constraint includes both string and []byte types
// For constraints like string | []byte, this returns true
// For pure slice constraints like ~[]E, this returns false
func hasMixedStringByteConstraint(iface *types.Interface) bool {
	hasString := false
	hasByteSlice := false

	// Check if the interface has type terms that include both string and []byte
	for i := 0; i < iface.NumEmbeddeds(); i++ {
		embedded := iface.EmbeddedType(i)
		if union, ok := embedded.(*types.Union); ok {
			for j := 0; j < union.Len(); j++ {
				term := union.Term(j)
				termType := term.Type().Underlying()

				// Check for string type
				if basicType, isBasic := termType.(*types.Basic); isBasic && (basicType.Info()&types.IsString) != 0 {
					hasString = true
				}

				// Check for []byte type
				if sliceType, isSlice := termType.(*types.Slice); isSlice {
					if elemType, isBasic := sliceType.Elem().(*types.Basic); isBasic && elemType.Kind() == types.Uint8 {
						hasByteSlice = true
					}
				}
			}
		} else {
			// Handle non-union embedded types
			termType := embedded.Underlying()

			// Check for string type
			if basicType, isBasic := termType.(*types.Basic); isBasic && (basicType.Info()&types.IsString) != 0 {
				hasString = true
			}

			// Check for []byte type
			if sliceType, isSlice := termType.(*types.Slice); isSlice {
				if elemType, isBasic := sliceType.Elem().(*types.Basic); isBasic && elemType.Kind() == types.Uint8 {
					hasByteSlice = true
				}
			}
		}
	}

	// Return true only if we have both string and []byte in the constraint
	return hasString && hasByteSlice
}

// getTypeHintForSliceElement returns the appropriate type hint for makeSlice based on the Go element type
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
	// For other types (structs, interfaces, pointers, etc.), don't provide a hint
	// This will use the default null initialization which is appropriate for object types
	return ""
}

// WriteCallExprMake handles make() function calls and translates them to TypeScript.
// It handles channel, map, and slice creation with different type patterns including:
// - Channel creation with different directions
// - Map creation for various type patterns
// - Slice creation with special handling for []byte, generic types, named types, instantiated generics, and selector expressions
func (c *GoToTSCompiler) WriteCallExprMake(exp *ast.CallExpr) error {
	// First check if we have a channel type
	if typ := c.pkg.TypesInfo.TypeOf(exp.Args[0]); typ != nil {
		if chanType, ok := typ.Underlying().(*types.Chan); ok {
			// Handle channel creation: make(chan T, bufferSize) or make(chan T)
			c.tsw.WriteLiterally("$.makeChannel<")
			c.WriteGoType(chanType.Elem(), GoTypeContextGeneral)
			c.tsw.WriteLiterally(">(")

			// If buffer size is provided, add it
			if len(exp.Args) >= 2 {
				if err := c.WriteValueExpr(exp.Args[1]); err != nil {
					return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
				}
			} else {
				// Default to 0 (unbuffered channel)
				c.tsw.WriteLiterally("0")
			}

			c.tsw.WriteLiterally(", ") // Add comma for zero value argument

			// Write the zero value for the channel's element type
			if chanType.Elem().String() == "struct{}" {
				c.tsw.WriteLiterally("{}")
			} else {
				c.WriteZeroValueForType(chanType.Elem())
			}

			// Add direction parameter
			c.tsw.WriteLiterally(", ")

			// Determine channel direction
			switch chanType.Dir() {
			case types.SendRecv:
				c.tsw.WriteLiterally("'both'")
			case types.SendOnly:
				c.tsw.WriteLiterally("'send'")
			case types.RecvOnly:
				c.tsw.WriteLiterally("'receive'")
			default:
				c.tsw.WriteLiterally("'both'") // Default to bidirectional
			}

			c.tsw.WriteLiterally(")")
			return nil // Handled make for channel
		}
	}
	// Handle make for slices: make([]T, len, cap) or make([]T, len)
	if len(exp.Args) >= 1 {
		// Handle map creation: make(map[K]V)
		if mapType, ok := exp.Args[0].(*ast.MapType); ok {
			c.tsw.WriteLiterally("$.makeMap<")
			c.WriteTypeExpr(mapType.Key) // Write the key type
			c.tsw.WriteLiterally(", ")
			c.WriteTypeExpr(mapType.Value) // Write the value type
			c.tsw.WriteLiterally(">()")
			return nil // Handled make for map
		}

		// Handle slice creation
		if _, ok := exp.Args[0].(*ast.ArrayType); ok {
			// Get the slice type information
			sliceType := c.pkg.TypesInfo.TypeOf(exp.Args[0])
			if sliceType == nil {
				return errors.New("could not get type information for slice in make call")
			}
			goUnderlyingType, ok := sliceType.Underlying().(*types.Slice)
			if !ok {
				return errors.New("expected slice type for make call")
			}
			goElemType := goUnderlyingType.Elem()

			// Check if it's make([]byte, ...)
			if c.isByteSliceType(sliceType) {
				var lengthArg, capacityArg interface{}
				if len(exp.Args) >= 2 {
					lengthArg = exp.Args[1]
				}
				if len(exp.Args) == 3 {
					capacityArg = exp.Args[2]
				}
				return c.writeByteSliceCreation(lengthArg, capacityArg)
			}

			// Check if the element type is a generic type parameter
			if _, isTypeParam := goElemType.(*types.TypeParam); isTypeParam {
				// This is make([]E, n) where E is a type parameter
				c.tsw.WriteLiterally("$.makeSlice<")
				c.WriteGoType(goElemType, GoTypeContextGeneral) // Write the element type parameter
				c.tsw.WriteLiterally(">(")

				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil { // Length
						return err
					}
					if len(exp.Args) == 3 {
						c.tsw.WriteLiterally(", ")
						if err := c.WriteValueExpr(exp.Args[2]); err != nil { // Capacity
							return err
						}
					} else if len(exp.Args) > 3 {
						return errors.New("makeSlice expects 2 or 3 arguments")
					}
				} else {
					// If no length is provided, default to 0
					c.tsw.WriteLiterally("0")
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled make for []E where E is type parameter
			}

			var lengthArg, capacityArg interface{}
			if len(exp.Args) >= 2 {
				lengthArg = exp.Args[1]
			}
			if len(exp.Args) == 3 {
				capacityArg = exp.Args[2]
			} else if len(exp.Args) > 3 {
				return errors.New("makeSlice expects 2 or 3 arguments")
			}

			return c.writeGenericSliceCreation(goElemType, lengthArg, capacityArg)
		}

		// Handle generic type parameter make calls: make(S, len, cap) where S ~[]E
		if ident, ok := exp.Args[0].(*ast.Ident); ok {
			// Check if this identifier refers to a type parameter
			if obj := c.pkg.TypesInfo.Uses[ident]; obj != nil {
				if typeName, isTypeName := obj.(*types.TypeName); isTypeName {
					if typeParam, isTypeParam := typeName.Type().(*types.TypeParam); isTypeParam {
						// Check if the type parameter is constrained to slice types
						constraint := typeParam.Constraint()
						if constraint != nil {
							underlying := constraint.Underlying()
							if iface, isInterface := underlying.(*types.Interface); isInterface {
								// Check if the constraint includes slice types
								// For constraints like ~[]E, we need to look at the type terms
								if hasSliceConstraint(iface) {
									// This is a generic slice type parameter
									// We need to determine the element type from the constraint
									elemType := getSliceElementTypeFromConstraint(iface)
									if elemType != nil {
										// Check if it's make(S, ...) where S constrains to []byte
										if c.isByteSliceType(types.NewSlice(elemType)) {
											var lengthArg, capacityArg interface{}
											if len(exp.Args) >= 2 {
												lengthArg = exp.Args[1]
											}
											if len(exp.Args) == 3 {
												capacityArg = exp.Args[2]
											}
											return c.writeByteSliceCreation(lengthArg, capacityArg)
										}

										var lengthArg, capacityArg interface{}
										if len(exp.Args) >= 2 {
											lengthArg = exp.Args[1]
										}
										if len(exp.Args) == 3 {
											capacityArg = exp.Args[2]
										} else if len(exp.Args) > 3 {
											return errors.New("makeSlice expects 2 or 3 arguments")
										}
										return c.writeGenericSliceCreation(elemType, lengthArg, capacityArg)
									}
								}
							}
						}
					} else {
						// Handle named types with slice underlying types: make(NamedSliceType, len, cap)
						// This handles cases like: type appendSliceWriter []byte; make(appendSliceWriter, 0, len(s))
						namedType := typeName.Type()
						if sliceType, isSlice := namedType.Underlying().(*types.Slice); isSlice {
							goElemType := sliceType.Elem()

							// Check if it's a named type with []byte underlying type
							if c.isByteSliceType(sliceType) {
								var lengthArg, capacityArg interface{}
								if len(exp.Args) >= 2 {
									lengthArg = exp.Args[1]
								}
								if len(exp.Args) == 3 {
									capacityArg = exp.Args[2]
								}
								return c.writeByteSliceCreation(lengthArg, capacityArg)
							}

							// Handle other named slice types
							var lengthArg, capacityArg interface{}
							if len(exp.Args) >= 2 {
								lengthArg = exp.Args[1]
							}
							if len(exp.Args) == 3 {
								capacityArg = exp.Args[2]
							} else if len(exp.Args) > 3 {
								return errors.New("makeSlice expects 2 or 3 arguments")
							}
							return c.writeGenericSliceCreation(goElemType, lengthArg, capacityArg)
						}

						// Handle named types with map underlying types: make(NamedMapType)
						if mapType, isMap := namedType.Underlying().(*types.Map); isMap {
							c.tsw.WriteLiterally("$.makeMap<")
							c.WriteGoType(mapType.Key(), GoTypeContextGeneral) // Write the key type
							c.tsw.WriteLiterally(", ")
							c.WriteGoType(mapType.Elem(), GoTypeContextGeneral) // Write the value type
							c.tsw.WriteLiterally(">()")
							return nil // Handled make for named map type
						}

						// Handle named types with channel underlying types: make(NamedChannelType, bufferSize)
						if chanType, isChan := namedType.Underlying().(*types.Chan); isChan {
							c.tsw.WriteLiterally("$.makeChannel<")
							c.WriteGoType(chanType.Elem(), GoTypeContextGeneral)
							c.tsw.WriteLiterally(">(")

							// If buffer size is provided, add it
							if len(exp.Args) >= 2 {
								if err := c.WriteValueExpr(exp.Args[1]); err != nil {
									return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
								}
							} else {
								// Default to 0 (unbuffered channel)
								c.tsw.WriteLiterally("0")
							}

							c.tsw.WriteLiterally(", ") // Add comma for zero value argument

							// Write the zero value for the channel's element type
							if chanType.Elem().String() == "struct{}" {
								c.tsw.WriteLiterally("{}")
							} else {
								c.WriteZeroValueForType(chanType.Elem())
							}

							// Add direction parameter
							c.tsw.WriteLiterally(", ")

							// Determine channel direction
							switch chanType.Dir() {
							case types.SendRecv:
								c.tsw.WriteLiterally("'both'")
							case types.SendOnly:
								c.tsw.WriteLiterally("'send'")
							case types.RecvOnly:
								c.tsw.WriteLiterally("'receive'")
							default:
								c.tsw.WriteLiterally("'both'") // Default to bidirectional
							}

							c.tsw.WriteLiterally(")")
							return nil // Handled make for named channel type
						}
					}
				}
			}
		}
	}
	// Handle instantiated generic types: make(GenericType[TypeArg], ...)
	// This handles cases like: make(Ints[int64]) where Ints[T] is a generic type
	if indexExpr, ok := exp.Args[0].(*ast.IndexExpr); ok {
		// Get the type information for the instantiated generic type
		if typ := c.pkg.TypesInfo.TypeOf(indexExpr); typ != nil {
			// Check the underlying type of the instantiated generic type
			underlying := typ.Underlying()

			// Handle instantiated generic map types: make(GenericMap[K, V])
			if mapType, isMap := underlying.(*types.Map); isMap {
				c.tsw.WriteLiterally("$.makeMap<")
				c.WriteGoType(mapType.Key(), GoTypeContextGeneral) // Write the key type
				c.tsw.WriteLiterally(", ")
				c.WriteGoType(mapType.Elem(), GoTypeContextGeneral) // Write the value type
				c.tsw.WriteLiterally(">()")
				return nil // Handled make for instantiated generic map type
			}

			// Handle instantiated generic slice types: make(GenericSlice[T], len, cap)
			if sliceType, isSlice := underlying.(*types.Slice); isSlice {
				goElemType := sliceType.Elem()

				// Check if it's an instantiated generic type with []byte underlying type
				if c.isByteSliceType(types.NewSlice(goElemType)) {
					var lengthArg, capacityArg interface{}
					if len(exp.Args) >= 2 {
						lengthArg = exp.Args[1]
					}
					if len(exp.Args) == 3 {
						capacityArg = exp.Args[2]
					}
					return c.writeByteSliceCreation(lengthArg, capacityArg)
				}

				// Handle other instantiated generic slice types
				var lengthArg, capacityArg interface{}
				if len(exp.Args) >= 2 {
					lengthArg = exp.Args[1]
				}
				if len(exp.Args) == 3 {
					capacityArg = exp.Args[2]
				} else if len(exp.Args) > 3 {
					return errors.New("makeSlice expects 2 or 3 arguments")
				}
				return c.writeGenericSliceCreation(goElemType, lengthArg, capacityArg)
			}

			// Handle instantiated generic channel types: make(GenericChannel[T], bufferSize)
			if chanType, isChan := underlying.(*types.Chan); isChan {
				c.tsw.WriteLiterally("$.makeChannel<")
				c.WriteGoType(chanType.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">(")

				// If buffer size is provided, add it
				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil {
						return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
					}
				} else {
					// Default to 0 (unbuffered channel)
					c.tsw.WriteLiterally("0")
				}

				c.tsw.WriteLiterally(", ") // Add comma for zero value argument

				// Write the zero value for the channel's element type
				if chanType.Elem().String() == "struct{}" {
					c.tsw.WriteLiterally("{}")
				} else {
					c.WriteZeroValueForType(chanType.Elem())
				}

				// Add direction parameter
				c.tsw.WriteLiterally(", ")

				// Determine channel direction
				switch chanType.Dir() {
				case types.SendRecv:
					c.tsw.WriteLiterally("'both'")
				case types.SendOnly:
					c.tsw.WriteLiterally("'send'")
				case types.RecvOnly:
					c.tsw.WriteLiterally("'receive'")
				default:
					c.tsw.WriteLiterally("'both'") // Default to bidirectional
				}

				c.tsw.WriteLiterally(")")
				return nil // Handled make for instantiated generic channel type
			}
		}
	}
	// Handle selector expressions: make(pkg.TypeName, ...)
	// This handles cases like: make(fstest.MapFS) where fstest.MapFS is map[string]*MapFile
	if selectorExpr, ok := exp.Args[0].(*ast.SelectorExpr); ok {
		// Get the type information for the selector expression
		if typ := c.pkg.TypesInfo.TypeOf(selectorExpr); typ != nil {
			// Check the underlying type of the selector expression
			underlying := typ.Underlying()

			// Handle selector expression map types: make(pkg.MapType)
			if mapType, isMap := underlying.(*types.Map); isMap {
				c.tsw.WriteLiterally("$.makeMap<")
				c.WriteGoType(mapType.Key(), GoTypeContextGeneral) // Write the key type
				c.tsw.WriteLiterally(", ")
				c.WriteGoType(mapType.Elem(), GoTypeContextGeneral) // Write the value type
				c.tsw.WriteLiterally(">()")
				return nil // Handled make for selector expression map type
			}

			// Handle selector expression slice types: make(pkg.SliceType, len, cap)
			if sliceType, isSlice := underlying.(*types.Slice); isSlice {
				goElemType := sliceType.Elem()

				// Check if it's a selector expression with []byte underlying type
				if c.isByteSliceType(sliceType) {
					var lengthArg, capacityArg interface{}
					if len(exp.Args) >= 2 {
						lengthArg = exp.Args[1]
					}
					if len(exp.Args) == 3 {
						capacityArg = exp.Args[2]
					}
					return c.writeByteSliceCreation(lengthArg, capacityArg)
				}

				// Handle other selector expression slice types
				var lengthArg, capacityArg interface{}
				if len(exp.Args) >= 2 {
					lengthArg = exp.Args[1]
				}
				if len(exp.Args) == 3 {
					capacityArg = exp.Args[2]
				} else if len(exp.Args) > 3 {
					return errors.New("makeSlice expects 2 or 3 arguments")
				}
				return c.writeGenericSliceCreation(goElemType, lengthArg, capacityArg)
			}

			// Handle selector expression channel types: make(pkg.ChannelType, bufferSize)
			if chanType, isChan := underlying.(*types.Chan); isChan {
				c.tsw.WriteLiterally("$.makeChannel<")
				c.WriteGoType(chanType.Elem(), GoTypeContextGeneral)
				c.tsw.WriteLiterally(">(")

				// If buffer size is provided, add it
				if len(exp.Args) >= 2 {
					if err := c.WriteValueExpr(exp.Args[1]); err != nil {
						return fmt.Errorf("failed to write buffer size in makeChannel: %w", err)
					}
				} else {
					// Default to 0 (unbuffered channel)
					c.tsw.WriteLiterally("0")
				}

				c.tsw.WriteLiterally(", ") // Add comma for zero value argument

				// Write the zero value for the channel's element type
				if chanType.Elem().String() == "struct{}" {
					c.tsw.WriteLiterally("{}")
				} else {
					c.WriteZeroValueForType(chanType.Elem())
				}

				// Add direction parameter
				c.tsw.WriteLiterally(", ")

				// Determine channel direction
				switch chanType.Dir() {
				case types.SendRecv:
					c.tsw.WriteLiterally("'both'")
				case types.SendOnly:
					c.tsw.WriteLiterally("'send'")
				case types.RecvOnly:
					c.tsw.WriteLiterally("'receive'")
				default:
					c.tsw.WriteLiterally("'both'") // Default to bidirectional
				}

				c.tsw.WriteLiterally(")")
				return nil // Handled make for selector expression channel type
			}
		}
	}
	// Fallthrough for unhandled make calls (e.g., channels)
	return errors.New("unhandled make call")
}
