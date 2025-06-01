package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
)

// writeNilConversion handles type conversions with nil argument
func (c *GoToTSCompiler) writeNilConversion(exp *ast.CallExpr) (handled bool, err error) {
	if len(exp.Args) != 1 {
		return false, nil
	}

	nilIdent, isIdent := exp.Args[0].(*ast.Ident)
	if !isIdent || nilIdent.Name != "nil" {
		return false, nil
	}

	// Handle nil pointer to struct type conversions: (*struct{})(nil)
	if starExpr, isStarExpr := exp.Fun.(*ast.StarExpr); isStarExpr {
		if _, isStructType := starExpr.X.(*ast.StructType); isStructType {
			c.tsw.WriteLiterally("null")
			return true, nil
		}
	}

	c.tsw.WriteLiterally("null")
	return true, nil
}

// writeArrayTypeConversion handles array type conversions like []rune(string)
func (c *GoToTSCompiler) writeArrayTypeConversion(exp *ast.CallExpr) (handled bool, err error) {
	arrayType, isArrayType := exp.Fun.(*ast.ArrayType)
	if !isArrayType {
		return false, nil
	}

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
					return true, nil
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
				if c.isStringType(tv.Type) {
					c.tsw.WriteLiterally("$.stringToBytes(")
					if err := c.WriteValueExpr(arg); err != nil {
						return true, fmt.Errorf("failed to write argument for []byte(string) conversion: %w", err)
					}
					c.tsw.WriteLiterally(")")
					return true, nil
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
								return true, nil
							}
						}
					}
				}
			}
		}
	}

	return false, nil
}

// writeStringConversion handles string() conversion
func (c *GoToTSCompiler) writeStringConversion(exp *ast.CallExpr) error {
	if len(exp.Args) != 1 {
		return fmt.Errorf("string() conversion expects exactly 1 argument, got %d", len(exp.Args))
	}

	arg := exp.Args[0]

	// Case 1: Argument is a string literal string("...")
	if basicLit, isBasicLit := arg.(*ast.BasicLit); isBasicLit && basicLit.Kind == token.STRING {
		// Translate string("...") to "..." (no-op)
		c.WriteBasicLit(basicLit)
		return nil
	}

	// Case 2: Argument is a rune (int32) or a call to rune()
	innerCall, isCallExpr := arg.(*ast.CallExpr)

	if isCallExpr {
		// Check if it's a call to rune()
		if innerFunIdent, innerFunIsIdent := innerCall.Fun.(*ast.Ident); innerFunIsIdent && innerFunIdent.String() == "rune" {
			// Translate string(rune(val)) to $.runeOrStringToString(val)
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

	// Handle direct string(int32) conversion
	if tv, ok := c.pkg.TypesInfo.Types[arg]; ok {
		// Case 3a: Argument is already a string - no-op
		if c.isStringType(tv.Type) {
			// Translate string(stringValue) to stringValue (no-op)
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write argument for string(string) no-op conversion: %w", err)
			}
			return nil
		}

		if basic, isBasic := tv.Type.Underlying().(*types.Basic); isBasic && (basic.Kind() == types.Int32 || basic.Kind() == types.UntypedRune) {
			// Translate string(rune_val) to $.runeOrStringToString(rune_val)
			c.tsw.WriteLiterally("$.runeOrStringToString(")
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write argument for string(int32) conversion: %w", err)
			}
			c.tsw.WriteLiterally(")")
			return nil
		}

		// Case 3: Argument is a slice of runes or bytes string([]rune{...}) or string([]byte{...})
		if c.isByteSliceType(tv.Type) {
			c.tsw.WriteLiterally("$.bytesToString(")
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write argument for string([]byte) conversion: %w", err)
			}
			c.tsw.WriteLiterally(")")
			return nil
		}
		if c.isRuneSliceType(tv.Type) {
			c.tsw.WriteLiterally("$.runesToString(")
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write argument for string([]rune) conversion: %w", err)
			}
			c.tsw.WriteLiterally(")")
			return nil
		}

		// Case 4: Argument is a generic type parameter (e.g., string | []byte)
		if typeParam, isTypeParam := tv.Type.(*types.TypeParam); isTypeParam {
			// Check if this is a []byte | string union constraint
			constraint := typeParam.Constraint()
			if constraint != nil {
				// For now, assume any type parameter that could be string or []byte needs the helper
				// This is a heuristic - in the future we could parse the constraint more precisely
				c.tsw.WriteLiterally("$.genericBytesOrStringToString(")
				if err := c.WriteValueExpr(arg); err != nil {
					return fmt.Errorf("failed to write argument for string(generic) conversion: %w", err)
				}
				c.tsw.WriteLiterally(")")
				return nil
			}
		}
	}

	return fmt.Errorf("unhandled string conversion: %s", exp.Fun)
}

// writeTypeConversion handles named type conversions
func (c *GoToTSCompiler) writeTypeConversion(exp *ast.CallExpr, funIdent *ast.Ident) (handled bool, err error) {
	// Check if this is a type conversion to a function type
	if funIdent == nil {
		return false, nil
	}

	if obj := c.pkg.TypesInfo.Uses[funIdent]; obj != nil {
		// Check if the object is a type name
		if typeName, isType := obj.(*types.TypeName); isType {
			// Make sure we have exactly one argument
			if len(exp.Args) == 1 {
				arg := exp.Args[0]

				// Check if we're converting FROM a type with receiver methods TO its underlying type
				if argType := c.pkg.TypesInfo.TypeOf(arg); argType != nil {
					if namedArgType, isNamed := argType.(*types.Named); isNamed {
						argTypeName := namedArgType.Obj().Name()
						// Check if the argument type has receiver methods
						if c.hasReceiverMethods(argTypeName) {
							// Check if we're converting to the underlying type
							targetType := typeName.Type()
							underlyingType := namedArgType.Underlying()
							if types.Identical(targetType, underlyingType) {
								// This is a conversion from a type with methods to its underlying type
								// Use valueOf() instead of TypeScript cast
								if err := c.WriteValueExpr(arg); err != nil {
									return true, fmt.Errorf("failed to write argument for valueOf conversion: %w", err)
								}
								c.tsw.WriteLiterally(".valueOf()")
								return true, nil
							}
						}
					}
				}

				// Check if this is a function type
				if _, isFuncType := typeName.Type().Underlying().(*types.Signature); isFuncType {
					// For function types, we need to add a __goTypeName property
					c.tsw.WriteLiterally("Object.assign(")

					// Write the argument first
					if err := c.WriteValueExpr(exp.Args[0]); err != nil {
						return true, fmt.Errorf("failed to write argument for function type cast: %w", err)
					}

					// Add the __goTypeName property with the function type name
					c.tsw.WriteLiterallyf(", { __goTypeName: '%s' })", funIdent.String())
					return true, nil
				} else {
					// Check if this type has receiver methods
					if c.hasReceiverMethods(funIdent.String()) {
						// For types with methods, use class constructor
						c.tsw.WriteLiterally("new ")
						c.tsw.WriteLiterally(funIdent.String())
						c.tsw.WriteLiterally("(")

						// Use auto-wrapping for the constructor argument
						// The constructor parameter type is the underlying type of the named type
						// For MyMode (which is type MyMode os.FileMode), the constructor expects os.FileMode
						constructorParamType := typeName.Type()
						if namedType, ok := typeName.Type().(*types.Named); ok {
							// For named types, the constructor expects the underlying type
							constructorParamType = namedType.Underlying()
						}

						if err := c.writeAutoWrappedArgument(exp.Args[0], constructorParamType); err != nil {
							return true, fmt.Errorf("failed to write argument for type constructor: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return true, nil
					} else {
						// For non-function types without methods, use the TypeScript "as" operator
						c.tsw.WriteLiterally("(")
						if err := c.WriteValueExpr(exp.Args[0]); err != nil {
							return true, fmt.Errorf("failed to write argument for type cast: %w", err)
						}

						// Then use the TypeScript "as" operator with the mapped type name
						c.tsw.WriteLiterally(" as ")
						c.WriteGoType(typeName.Type(), GoTypeContextGeneral)
						c.tsw.WriteLiterally(")")
						return true, nil
					}
				}
			}
		}
	}

	return false, nil
}

// writeIntConversion handles int() conversion
func (c *GoToTSCompiler) writeIntConversion(exp *ast.CallExpr) error {
	if len(exp.Args) != 1 {
		return fmt.Errorf("int() conversion expects exactly 1 argument, got %d", len(exp.Args))
	}

	arg := exp.Args[0]

	// Check if we're converting FROM a type with receiver methods TO int
	if argType := c.pkg.TypesInfo.TypeOf(arg); argType != nil {
		if namedArgType, isNamed := argType.(*types.Named); isNamed {
			argTypeName := namedArgType.Obj().Name()
			// Check if the argument type has receiver methods
			if c.hasReceiverMethods(argTypeName) {
				// Check if we're converting to int (the underlying type)
				if types.Identical(types.Typ[types.Int], namedArgType.Underlying()) {
					// This is a conversion from a type with methods to int
					// Use valueOf() instead of $.int()
					if err := c.WriteValueExpr(arg); err != nil {
						return fmt.Errorf("failed to write argument for valueOf conversion: %w", err)
					}
					c.tsw.WriteLiterally(".valueOf()")
					return nil
				}
			}
		}
	}

	// Default case: Translate int(value) to $.int(value)
	c.tsw.WriteLiterally("$.int(")
	if err := c.WriteValueExpr(exp.Args[0]); err != nil {
		return fmt.Errorf("failed to write argument for int() conversion: %w", err)
	}
	c.tsw.WriteLiterally(")")
	return nil
}

// writeQualifiedTypeConversion handles qualified type conversions like os.FileMode(value)
func (c *GoToTSCompiler) writeQualifiedTypeConversion(exp *ast.CallExpr, selectorExpr *ast.SelectorExpr) (handled bool, err error) {
	// Check if this is a type conversion by looking up the selector in the type info
	if obj := c.pkg.TypesInfo.Uses[selectorExpr.Sel]; obj != nil {
		// Check if the object is a type name
		if typeName, isType := obj.(*types.TypeName); isType {
			// Make sure we have exactly one argument
			if len(exp.Args) == 1 {
				arg := exp.Args[0]

				// Check if we're converting FROM a type with receiver methods TO its underlying type
				if argType := c.pkg.TypesInfo.TypeOf(arg); argType != nil {
					if namedArgType, isNamed := argType.(*types.Named); isNamed {
						argTypeName := namedArgType.Obj().Name()
						// Check if the argument type has receiver methods
						if c.hasReceiverMethods(argTypeName) {
							// Check if we're converting to the underlying type
							targetType := typeName.Type()
							underlyingType := namedArgType.Underlying()
							if types.Identical(targetType, underlyingType) {
								// This is a conversion from a type with methods to its underlying type
								// Use valueOf() instead of TypeScript cast
								if err := c.WriteValueExpr(arg); err != nil {
									return true, fmt.Errorf("failed to write argument for valueOf conversion: %w", err)
								}
								c.tsw.WriteLiterally(".valueOf()")
								return true, nil
							}
						}
					}
				}

				// Check if this is a function type
				if _, isFuncType := typeName.Type().Underlying().(*types.Signature); isFuncType {
					// For function types, we need to add a __goTypeName property
					c.tsw.WriteLiterally("Object.assign(")

					// Write the argument first
					if err := c.WriteValueExpr(exp.Args[0]); err != nil {
						return true, fmt.Errorf("failed to write argument for function type cast: %w", err)
					}

					// Add the __goTypeName property with the function type name
					c.tsw.WriteLiterallyf(", { __goTypeName: '%s' })", selectorExpr.Sel.Name)
					return true, nil
				} else {
					// Determine if this type should use constructor syntax
					shouldUseConstructor := false

					// Check if it's a type alias (like os.FileMode)
					if alias, isAlias := typeName.Type().(*types.Alias); isAlias {
						// For type aliases, check the underlying type
						if _, isInterface := alias.Underlying().(*types.Interface); !isInterface {
							if _, isStruct := alias.Underlying().(*types.Struct); !isStruct {
								// For non-struct, non-interface type aliases, use constructor
								shouldUseConstructor = true
							}
						}
					} else if namedType, isNamed := typeName.Type().(*types.Named); isNamed {
						// For named types, check if they have receiver methods in the current package
						// or if they follow the pattern of non-struct, non-interface named types
						if c.hasReceiverMethods(selectorExpr.Sel.Name) {
							shouldUseConstructor = true
						} else if _, isInterface := namedType.Underlying().(*types.Interface); !isInterface {
							if _, isStruct := namedType.Underlying().(*types.Struct); !isStruct {
								// For non-struct, non-interface named types, use constructor
								shouldUseConstructor = true
							}
						}
					}

					if shouldUseConstructor {
						// For types that should use constructors, use class constructor
						c.tsw.WriteLiterally("new ")
						if err := c.WriteSelectorExpr(selectorExpr); err != nil {
							return true, fmt.Errorf("failed to write qualified type name: %w", err)
						}
						c.tsw.WriteLiterally("(")
						if err := c.WriteValueExpr(exp.Args[0]); err != nil {
							return true, fmt.Errorf("failed to write argument for type constructor: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return true, nil
					} else {
						// For types that don't need constructors, use the TypeScript "as" operator
						c.tsw.WriteLiterally("(")
						if err := c.WriteValueExpr(exp.Args[0]); err != nil {
							return true, fmt.Errorf("failed to write argument for type cast: %w", err)
						}

						// Then use the TypeScript "as" operator with the mapped type name
						c.tsw.WriteLiterally(" as ")
						c.WriteGoType(typeName.Type(), GoTypeContextGeneral)
						c.tsw.WriteLiterally(")")
						return true, nil
					}
				}
			}
		}
	}

	return false, nil
}
