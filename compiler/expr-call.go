package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"

	"github.com/pkg/errors"
)

// WriteCallExpr translates a Go function call expression (`ast.CallExpr`)
// into its TypeScript equivalent.
// It handles several Go built-in functions specially:
// - `println(...)` becomes `console.log(...)`.
// - `panic(...)` becomes `$.panic(...)`.
// - `len(arg)` becomes `$.len(arg)`.
// - `cap(arg)` becomes `$.cap(arg)`.
// - `delete(m, k)` becomes `$.deleteMapEntry(m, k)`.
// - `make(chan T, size)` becomes `$.makeChannel<T_ts>(size, zeroValueForT)`.
// - `make(map[K]V)` becomes `$.makeMap<K_ts, V_ts>()`.
// - `make([]T, len, cap)` becomes `$.makeSlice<T_ts>(len, cap)`.
// - `string(runeVal)` becomes `String.fromCharCode(runeVal)`.
// - `string([]runeVal)` or `string([]byteVal)` becomes `$.runesToString(sliceVal)`.
// - `[]rune(stringVal)` becomes `$.stringToRunes(stringVal)`.
// - `close(ch)` becomes `ch.close()`.
// - `append(slice, elems...)` becomes `$.append(slice, elems...)`.
// - `byte(val)` becomes `$.byte(val)`.
// For other function calls:
//   - If the `Analysis` data indicates the function is asynchronous (e.g., due to
//     channel operations or `go`/`defer` usage within it), the call is prefixed with `await`.
//   - Otherwise, it's translated as a standard TypeScript function call: `funcName(arg1, arg2)`.
//
// Arguments are recursively translated using `WriteValueExpr`.
func (c *GoToTSCompiler) WriteCallExpr(exp *ast.CallExpr) error {
	expFun := exp.Fun

	// Handle any type conversion with nil argument
	if len(exp.Args) == 1 {
		if nilIdent, isIdent := exp.Args[0].(*ast.Ident); isIdent && nilIdent.Name == "nil" {
			// Handle nil pointer to struct type conversions: (*struct{})(nil)
			if starExpr, isStarExpr := expFun.(*ast.StarExpr); isStarExpr {
				if _, isStructType := starExpr.X.(*ast.StructType); isStructType {
					c.tsw.WriteLiterally("null")
					return nil
				}
			}

			c.tsw.WriteLiterally("null")
			return nil
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
							return fmt.Errorf("failed to write argument for []rune(string) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return nil // Handled []rune(string)
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
							return fmt.Errorf("failed to write argument for []byte(string) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return nil // Handled []byte(string)
					}
				}
			}
		}
	}

	if funIdent, funIsIdent := expFun.(*ast.Ident); funIsIdent {
		switch funIdent.String() {
		case "panic":
			c.tsw.WriteLiterally("$.panic(")
		case "println":
			c.tsw.WriteLiterally("console.log(")
			for i, arg := range exp.Args {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(arg); err != nil {
					return err
				}
			}
			c.tsw.WriteLiterally(")")
			return nil
		case "len":
			// Translate len(arg) to $.len(arg)
			if len(exp.Args) == 1 {
				c.tsw.WriteLiterally("$.len(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled len
			}
			return errors.New("unhandled len call with incorrect number of arguments")
		case "cap":
			// Translate cap(arg) to $.cap(arg)
			if len(exp.Args) == 1 {
				c.tsw.WriteLiterally("$.cap(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled cap
			}
			return errors.New("unhandled cap call with incorrect number of arguments")
		case "delete":
			// Translate delete(map, key) to $.deleteMapEntry(map, key)
			if len(exp.Args) == 2 {
				c.tsw.WriteLiterally("$.deleteMapEntry(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil { // Map
					return err
				}
				c.tsw.WriteLiterally(", ")
				if err := c.WriteValueExpr(exp.Args[1]); err != nil { // Key
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled delete
			}
			return errors.New("unhandled delete call with incorrect number of arguments")
		case "make":
			// First check if we have a channel type
			if typ := c.pkg.TypesInfo.TypeOf(exp.Args[0]); typ != nil {
				if chanType, ok := typ.Underlying().(*types.Chan); ok {
					// Handle channel creation: make(chan T, bufferSize) or make(chan T)
					c.tsw.WriteLiterally("$.makeChannel<")
					c.WriteGoType(chanType.Elem())
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
					goElemType, ok := sliceType.Underlying().(*types.Slice)
					if !ok {
						return errors.New("expected slice type for make call")
					}

					c.tsw.WriteLiterally("$.makeSlice<")
					c.WriteGoType(goElemType.Elem()) // Write the element type
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
					return nil // Handled make for slice
				}
			}
			// Fallthrough for unhandled make calls (e.g., channels)
			return errors.New("unhandled make call")
		case "string":
			// Handle string() conversion
			if len(exp.Args) == 1 {
				arg := exp.Args[0]

				// Case 1: Argument is a string literal string("...")
				if basicLit, isBasicLit := arg.(*ast.BasicLit); isBasicLit && basicLit.Kind == token.STRING {
					// Translate string("...") to "..." (no-op)
					c.WriteBasicLit(basicLit)
					return nil // Handled string literal conversion
				}

				// Case 2: Argument is a rune (int32) or a call to rune()
				innerCall, isCallExpr := arg.(*ast.CallExpr)

				if isCallExpr {
					// Check if it's a call to rune()
					if innerFunIdent, innerFunIsIdent := innerCall.Fun.(*ast.Ident); innerFunIsIdent && innerFunIdent.String() == "rune" {
						// Translate string(rune(val)) to String.fromCharCode(val)
						if len(innerCall.Args) == 1 {
							c.tsw.WriteLiterally("String.fromCharCode(")
							if err := c.WriteValueExpr(innerCall.Args[0]); err != nil {
								return fmt.Errorf("failed to write argument for string(rune) conversion: %w", err)
							}
							c.tsw.WriteLiterally(")")
							return nil // Handled string(rune)
						}
					}
				}

				// Handle direct string(int32) conversion
				// This assumes 'rune' is int32
				if tv, ok := c.pkg.TypesInfo.Types[arg]; ok {
					if basic, isBasic := tv.Type.Underlying().(*types.Basic); isBasic && (basic.Kind() == types.Int32 || basic.Kind() == types.UntypedRune) {
						// Translate string(rune_val) to String.fromCharCode(rune_val)
						c.tsw.WriteLiterally("String.fromCharCode(")
						if err := c.WriteValueExpr(arg); err != nil {
							return fmt.Errorf("failed to write argument for string(int32) conversion: %w", err)
						}
						c.tsw.WriteLiterally(")")
						return nil // Handled string(int32)
					}

					// Case 3: Argument is a slice of runes or bytes string([]rune{...}) or string([]byte{...})
					if sliceType, isSlice := tv.Type.Underlying().(*types.Slice); isSlice {
						if basic, isBasic := sliceType.Elem().Underlying().(*types.Basic); isBasic {
							// Handle both runes (int32) and bytes (uint8)
							if basic.Kind() == types.Int32 || basic.Kind() == types.Uint8 {
								// Translate string([]rune) or string([]byte) to $.runesToString(...)
								c.tsw.WriteLiterally("$.runesToString(")
								if err := c.WriteValueExpr(arg); err != nil {
									return fmt.Errorf("failed to write argument for string([]rune/[]byte) conversion: %w", err)
								}
								c.tsw.WriteLiterally(")")
								return nil // Handled string([]rune) or string([]byte)
							}
						}
					}
				}
			}
			// Return error for other unhandled string conversions
			return fmt.Errorf("unhandled string conversion: %s", exp.Fun)
		case "close":
			// Translate close(ch) to ch.close()
			if len(exp.Args) == 1 {
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return fmt.Errorf("failed to write channel in close call: %w", err)
				}
				c.tsw.WriteLiterally(".close()")
				return nil // Handled close
			}
			return errors.New("unhandled close call with incorrect number of arguments")
		case "append":
			// Translate append(slice, elements...) to $.append(slice, elements...)
			if len(exp.Args) >= 1 {
				c.tsw.WriteLiterally("$.append(")
				// The first argument is the slice
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return fmt.Errorf("failed to write slice in append call: %w", err)
				}
				// The remaining arguments are the elements to append
				for i, arg := range exp.Args[1:] {
					if i > 0 || len(exp.Args) > 1 { // Add comma before elements if there are any
						c.tsw.WriteLiterally(", ")
					}
					if err := c.WriteValueExpr(arg); err != nil {
						return fmt.Errorf("failed to write argument %d in append call: %w", i+1, err)
					}
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled append
			}
			return errors.New("unhandled append call with incorrect number of arguments")
		case "byte":
			// Translate byte(val) to $.byte(val)
			if len(exp.Args) == 1 {
				c.tsw.WriteLiterally("$.byte(")
				if err := c.WriteValueExpr(exp.Args[0]); err != nil {
					return err
				}
				c.tsw.WriteLiterally(")")
				return nil // Handled byte
			}
			return errors.New("unhandled byte call with incorrect number of arguments")
		default:
			// Check if this is a type conversion to a function type
			if funIdent != nil {
				if obj := c.pkg.TypesInfo.Uses[funIdent]; obj != nil {
					// Check if the object is a type name
					if typeName, isType := obj.(*types.TypeName); isType {
						// Make sure we have exactly one argument
						if len(exp.Args) == 1 {
							// Check if this is a function type
							if _, isFuncType := typeName.Type().Underlying().(*types.Signature); isFuncType {
								// For function types, we need to add a __goTypeName property
								c.tsw.WriteLiterally("Object.assign(")

								// Write the argument first
								if err := c.WriteValueExpr(exp.Args[0]); err != nil {
									return fmt.Errorf("failed to write argument for function type cast: %w", err)
								}

								// Add the __goTypeName property with the function type name
								c.tsw.WriteLiterallyf(", { __goTypeName: '%s' })", funIdent.String())
								return nil // Handled function type cast
							} else {
								// For non-function types, use the TypeScript "as" operator
								c.tsw.WriteLiterally("(")
								if err := c.WriteValueExpr(exp.Args[0]); err != nil {
									return fmt.Errorf("failed to write argument for type cast: %w", err)
								}

								// Then use the TypeScript "as" operator with the type name
								c.tsw.WriteLiterallyf(" as %s)", funIdent.String())
								return nil // Handled non-function type cast
							}
						}
					}
				}
			}

			// Check if this is an async function call
			if funIdent != nil {
				// Get the object for this function identifier
				if obj := c.pkg.TypesInfo.Uses[funIdent]; obj != nil && c.analysis.IsAsyncFunc(obj) {
					// This is an async function
					c.tsw.WriteLiterally("await ")
				}
			}

			// Not a special built-in, treat as a regular function call
			if err := c.WriteValueExpr(expFun); err != nil {
				return fmt.Errorf("failed to write function expression in call: %w", err)
			}

			if funType := c.pkg.TypesInfo.TypeOf(expFun); funType != nil {
				if _, ok := funType.Underlying().(*types.Signature); ok {
					if _, isNamed := funType.(*types.Named); isNamed {
						c.tsw.WriteLiterally("!")
					}
				}
			}

			c.tsw.WriteLiterally("(")
			for i, arg := range exp.Args {
				if i != 0 {
					c.tsw.WriteLiterally(", ")
				}
				if err := c.WriteValueExpr(arg); err != nil {
					return fmt.Errorf("failed to write argument %d in call: %w", i, err)
				}
			}
			c.tsw.WriteLiterally(")")
			return nil // Handled regular function call
		}
	} else {
		// Not an identifier (e.g., method call on a value)
		if err := c.WriteValueExpr(expFun); err != nil {
			return fmt.Errorf("failed to write method expression in call: %w", err)
		}

		if funType := c.pkg.TypesInfo.TypeOf(expFun); funType != nil {
			if _, ok := funType.Underlying().(*types.Signature); ok {
				if _, isNamed := funType.(*types.Named); isNamed {
					c.tsw.WriteLiterally("!")
				}
			}
		}
	}
	c.tsw.WriteLiterally("(")
	for i, arg := range exp.Args {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		if err := c.WriteValueExpr(arg); err != nil {
			return fmt.Errorf("failed to write argument %d in call: %w", i, err)
		}
	}
	c.tsw.WriteLiterally(")")
	return nil
}
