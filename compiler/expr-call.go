package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
	"strings"
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
// - `make([]byte, len, cap)` becomes `new Uint8Array(len)`.
// - `string(runeVal)` becomes `$.runeOrStringToString(runeVal)`.
// - `string([]runeVal)` becomes `$.runesToString(sliceVal)`.
// - `string([]byteVal)` becomes `$.bytesToString(sliceVal)`.
// - `[]rune(stringVal)` becomes `$.stringToRunes(stringVal)".
// - `[]byte(stringVal)` becomes `$.stringToBytes(stringVal)`.
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

	// Handle protobuf method calls
	if handled, err := c.writeProtobufMethodCall(exp); handled {
		return err
	}

	// Handle any type conversion with nil argument
	if handled, err := c.writeNilConversion(exp); handled {
		return err
	}

	// Handle array type conversions like []rune(string)
	if handled, err := c.writeArrayTypeConversion(exp); handled {
		return err
	}

	// Handle built-in functions called as identifiers
	if funIdent, funIsIdent := expFun.(*ast.Ident); funIsIdent {
		// Check for built-in functions first
		if handled, err := c.writeBuiltinFunction(exp, funIdent.String()); handled {
			if err != nil {
				return err
			}
			// For built-ins that don't return early, write the arguments
			if funIdent.String() != "new" && funIdent.String() != "close" && funIdent.String() != "make" &&
				funIdent.String() != "string" && funIdent.String() != "append" && funIdent.String() != "byte" &&
				funIdent.String() != "int" {
				return c.writeCallArguments(exp)
			}
			return nil
		}

		// Check for type conversions
		if handled, err := c.writeTypeConversion(exp, funIdent); handled {
			return err
		}

		// Check if this is an async function call
		_ = c.writeAsyncCall(exp, funIdent)

		// Not a special built-in, treat as a regular function call
		if err := c.WriteValueExpr(expFun); err != nil {
			return fmt.Errorf("failed to write function expression in call: %w", err)
		}

		c.addNonNullAssertion(expFun)
		return c.writeCallArguments(exp)
	}

	// Handle qualified type conversions like os.FileMode(value)
	if selectorExpr, ok := expFun.(*ast.SelectorExpr); ok {
		if handled, err := c.writeQualifiedTypeConversion(exp, selectorExpr); handled {
			return err
		}
	}

	// Handle non-identifier function expressions (method calls, function literals, etc.)
	// Check if this is an async method call (e.g., mu.Lock())
	_ = c.writeAsyncMethodCall(exp)

	// If expFun is a function literal, it needs to be wrapped in parentheses for IIFE syntax
	if _, isFuncLit := expFun.(*ast.FuncLit); isFuncLit {
		c.tsw.WriteLiterally("(")
		if err := c.WriteValueExpr(expFun); err != nil {
			return fmt.Errorf("failed to write function literal in call: %w", err)
		}
		c.tsw.WriteLiterally(")")
	} else {
		// Not an identifier (e.g., method call on a value, function call result)
		if err := c.WriteValueExpr(expFun); err != nil {
			return fmt.Errorf("failed to write method expression in call: %w", err)
		}

		// Check if this is a function call that returns a function (e.g., simpleIterator(m)())
		// Add non-null assertion since the returned function could be null
		if _, isCallExpr := expFun.(*ast.CallExpr); isCallExpr {
			c.tsw.WriteLiterally("!")
		} else {
			c.addNonNullAssertion(expFun)
		}
	}

	return c.writeCallArguments(exp)
}

// writeCallArguments writes the argument list for a function call
func (c *GoToTSCompiler) writeCallArguments(exp *ast.CallExpr) error {
	c.tsw.WriteLiterally("(")

	// Get function signature for parameter type checking
	var funcSig *types.Signature
	if c.pkg != nil && c.pkg.TypesInfo != nil {
		if funcType := c.pkg.TypesInfo.TypeOf(exp.Fun); funcType != nil {
			if sig, ok := funcType.(*types.Signature); ok {
				funcSig = sig
			}
		}
	}

	for i, arg := range exp.Args {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		// Check if this is the last argument and we have ellipsis (variadic call)
		if exp.Ellipsis != token.NoPos && i == len(exp.Args)-1 {
			c.tsw.WriteLiterally("...")
		}

		// Check if we need to auto-wrap this argument
		needsWrapping := false
		var wrapperTypeName string

		if funcSig != nil && i < funcSig.Params().Len() {
			paramType := funcSig.Params().At(i).Type()

			if c.analysis != nil {
				isWrapper := c.analysis.IsWrapperType(paramType)

				if isWrapper {
					// Check if the argument is a literal or non-wrapper type that should be wrapped
					argType := c.pkg.TypesInfo.TypeOf(arg)

					argIsWrapper := false
					if argType != nil {
						argIsWrapper = c.analysis.IsWrapperType(argType)
					}

					// Check if the argument is a basic literal that should be wrapped
					isBasicLiteral := false
					if _, ok := arg.(*ast.BasicLit); ok {
						isBasicLiteral = true
					}

					if argType == nil || !argIsWrapper || isBasicLiteral {
						// This argument should be wrapped
						needsWrapping = true

						// Get the wrapper type name for constructor call
						if namedType, ok := paramType.(*types.Named); ok {
							if obj := namedType.Obj(); obj != nil {
								if obj.Pkg() != nil && obj.Pkg() != c.pkg.Types {
									// Imported type like os.FileMode
									if importAlias := c.getImportAlias(obj.Pkg().Path()); importAlias != "" {
										wrapperTypeName = importAlias + "." + obj.Name()
									} else {
										wrapperTypeName = obj.Name()
									}
								} else {
									// Local type
									wrapperTypeName = obj.Name()
								}
							}
						}

						// Handle type aliases (Go 1.9+)
						if aliasType, ok := paramType.(*types.Alias); ok {
							if obj := aliasType.Obj(); obj != nil {
								if obj.Pkg() != nil && obj.Pkg() != c.pkg.Types {
									// Imported type like os.FileMode
									pkgPath := obj.Pkg().Path()
									if importAlias := c.getImportAlias(pkgPath); importAlias != "" {
										wrapperTypeName = importAlias + "." + obj.Name()
									} else {
										wrapperTypeName = obj.Name()
									}
								} else {
									// Local type
									wrapperTypeName = obj.Name()
								}
							}
						}
					}
				}
			}
		}

		if needsWrapping && wrapperTypeName != "" {
			// Auto-wrap the argument with constructor call
			c.tsw.WriteLiterally("new ")
			c.tsw.WriteLiterally(wrapperTypeName)
			c.tsw.WriteLiterally("(")
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write wrapped argument: %w", err)
			}
			c.tsw.WriteLiterally(")")
		} else {
			// Normal argument writing
			if err := c.WriteValueExpr(arg); err != nil {
				return fmt.Errorf("failed to write argument: %w", err)
			}
		}
	}

	c.tsw.WriteLiterally(")")
	return nil
}

// getImportAlias returns the import alias for a given package path
func (c *GoToTSCompiler) getImportAlias(pkgPath string) string {
	if c.analysis == nil {
		return ""
	}

	// First try to find by exact package path
	for importAlias := range c.analysis.Imports {
		if importInfo := c.analysis.Imports[importAlias]; importInfo != nil {
			if importInfo.importPath == pkgPath {
				return importAlias
			}
		}
	}

	// Fallback: try to match by package name extracted from path
	parts := strings.Split(pkgPath, "/")
	defaultPkgName := parts[len(parts)-1]

	for importAlias := range c.analysis.Imports {
		if importAlias == defaultPkgName {
			return importAlias
		}
	}

	return ""
}

// writeAutoWrappedArgument writes an argument, auto-wrapping it if needed based on the expected parameter type
func (c *GoToTSCompiler) writeAutoWrappedArgument(arg ast.Expr, expectedType types.Type) error {
	// Check if we need to auto-wrap this argument
	needsWrapping := false
	var wrapperTypeName string

	if c.analysis != nil && c.analysis.IsWrapperType(expectedType) {
		// Check if the argument is a literal or non-wrapper type that should be wrapped
		argType := c.pkg.TypesInfo.TypeOf(arg)

		argIsWrapper := false
		if argType != nil {
			argIsWrapper = c.analysis.IsWrapperType(argType)
		}

		// Check if the argument is a basic literal that should be wrapped
		isBasicLiteral := false
		if _, ok := arg.(*ast.BasicLit); ok {
			isBasicLiteral = true
		}

		if argType == nil || !argIsWrapper || isBasicLiteral {
			// This argument should be wrapped
			needsWrapping = true

			// Get the wrapper type name for constructor call
			if namedType, ok := expectedType.(*types.Named); ok {
				if obj := namedType.Obj(); obj != nil {
					if obj.Pkg() != nil && obj.Pkg() != c.pkg.Types {
						// Imported type like os.FileMode
						if importAlias := c.getImportAlias(obj.Pkg().Path()); importAlias != "" {
							wrapperTypeName = importAlias + "." + obj.Name()
						} else {
							wrapperTypeName = obj.Name()
						}
					} else {
						// Local type
						wrapperTypeName = obj.Name()
					}
				}
			}

			// Handle type aliases (Go 1.9+)
			if aliasType, ok := expectedType.(*types.Alias); ok {
				if obj := aliasType.Obj(); obj != nil {
					if obj.Pkg() != nil && obj.Pkg() != c.pkg.Types {
						// Imported type like os.FileMode
						pkgPath := obj.Pkg().Path()
						if importAlias := c.getImportAlias(pkgPath); importAlias != "" {
							wrapperTypeName = importAlias + "." + obj.Name()
						} else {
							wrapperTypeName = obj.Name()
						}
					} else {
						// Local type
						wrapperTypeName = obj.Name()
					}
				}
			}
		}
	}

	if needsWrapping && wrapperTypeName != "" {
		// Auto-wrap the argument with constructor call
		c.tsw.WriteLiterally("new ")
		c.tsw.WriteLiterally(wrapperTypeName)
		c.tsw.WriteLiterally("(")
		if err := c.WriteValueExpr(arg); err != nil {
			return fmt.Errorf("failed to write wrapped argument: %w", err)
		}
		c.tsw.WriteLiterally(")")
	} else {
		// Normal argument writing
		if err := c.WriteValueExpr(arg); err != nil {
			return fmt.Errorf("failed to write argument: %w", err)
		}
	}

	return nil
}
