package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
	// No "strings" import needed.
	// "fmt" is used for fmt.Errorf.
)

// WriteCallExpr translates a Go function call expression (`ast.CallExpr`)
// into its TypeScript equivalent.
//
// Order of operations:
// 1. Protobuf method calls are handled by `c.writeProtobufMethodCall` (see `expr-call-protobuf.go`).
// 2. Specific type conversions (e.g., nil args, `[]rune(string)`) are handled by `c.writeTypeConversionExpr` (see `expr-call-typeconv.go`).
// 3. Built-in Go functions (e.g., `len`, `make`, `panic`) are handled by `c.writeBuiltinCallExpr` (see `expr-call-builtin.go`).
//    - Some built-ins are fully translated by `writeBuiltinCallExpr`.
//    - Others (like `len`, `cap`) have their function name written, and argument processing continues in this function.
// 4. If the function is an identifier (`*ast.Ident`) but not a built-in:
//    - Type conversions (e.g., `MyType(value)`, `int(value)`) are processed.
//    - Asynchronous function calls (based on `c.analysis.IsAsyncFunc`) are prefixed with `await`.
//    - Standard function calls are prepared.
// 5. If the function is not an identifier (e.g., a selector `foo.Bar()` or a function literal):
//    - Asynchronous method calls are handled.
//    - Function literals (IIFEs) are wrapped correctly.
//    - Standard method calls are prepared.
// 6. Finally, arguments for calls that weren't fully handled by the specialized functions are written.
//
// Arguments are recursively translated using `WriteValueExpr`.
func (c *GoToTSCompiler) WriteCallExpr(exp *ast.CallExpr) error {
	expFun := exp.Fun

	// 1. Handle protobuf method calls
	if handled, err := c.writeProtobufMethodCall(exp); handled {
		return err // err might be nil if handled successfully
	}

	// 2. Handle specific type conversions (nil args, []rune(string), []byte(string), etc.)
	if handled, err := c.writeTypeConversionExpr(exp, expFun); handled {
		return err // err might be nil if handled successfully
	}

	if funIdent, funIsIdent := expFun.(*ast.Ident); funIsIdent {
		// 3. Try to handle as a Go built-in function call
		isBuiltin, err := c.writeBuiltinCallExpr(exp, funIdent)
		if err != nil { // An error occurred *during* processing of a recognized built-in
			return fmt.Errorf("error writing built-in call for %s: %w", funIdent.String(), err)
		}

		if isBuiltin {
			// Built-in was recognized and its function part written (or fully handled).
			// Check if it's one of the built-ins that are fully self-contained by writeBuiltinCallExpr.
			switch funIdent.String() {
			case "new", "make", "string", "close", "append", "byte", "int":
				return nil // These are fully handled (including args) by writeBuiltinCallExpr.
			default:
				// Other builtins (len, cap, panic, println, delete, copy, recover)
				// have had their function part written.
				// Proceed to write their arguments using the common logic below.
			}
		} else {
			// 4. Not a built-in. Handle other *ast.Ident cases (type conversions, async, regular func).
			// This is the "default" logic for identifiers.
			if obj := c.pkg.TypesInfo.Uses[funIdent]; obj != nil {
				if typeName, isType := obj.(*types.TypeName); isType {
					if len(exp.Args) == 1 { // Common for type conversions
						arg := exp.Args[0]
						// Conversion from a type with methods to its underlying type?
						if argType := c.pkg.TypesInfo.TypeOf(arg); argType != nil {
							if namedArgType, isNamed := argType.(*types.Named); isNamed {
								if c.hasReceiverMethods(namedArgType.Obj().Name()) {
									if types.Identical(typeName.Type(), namedArgType.Underlying()) {
										if err := c.WriteValueExpr(arg); err != nil {
											return fmt.Errorf("failed to write argument for valueOf conversion: %w", err)
										}
										c.tsw.WriteLiterally(".valueOf()")
										return nil
									}
								}
							}
						}

						// Function type conversion?
						if _, isFuncType := typeName.Type().Underlying().(*types.Signature); isFuncType {
							c.tsw.WriteLiterally("Object.assign(")
							if err := c.WriteValueExpr(exp.Args[0]); err != nil {
								return fmt.Errorf("failed to write argument for function type cast: %w", err)
							}
							c.tsw.WriteLiterallyf(", { __goTypeName: '%s' })", funIdent.String())
							return nil
						} else { // Other type conversions (structs with methods, or basic 'as' cast)
							if c.hasReceiverMethods(funIdent.String()) { // Type with methods?
								c.tsw.WriteLiterally("new ")
								c.tsw.WriteLiterally(funIdent.String())
								c.tsw.WriteLiterally("(")
								if err := c.WriteValueExpr(exp.Args[0]); err != nil {
									return fmt.Errorf("failed to write argument for type constructor: %w", err)
								}
								c.tsw.WriteLiterally(")")
								return nil
							} else { // Basic 'as' type cast
								c.tsw.WriteLiterally("(")
								if err := c.WriteValueExpr(exp.Args[0]); err != nil {
									return fmt.Errorf("failed to write argument for type cast: %w", err)
								}
								c.tsw.WriteLiterally(" as ")
								c.WriteGoType(typeName.Type(), GoTypeContextGeneral)
								c.tsw.WriteLiterally(")")
								return nil
							}
						}
					}
				}
			}

			// Standard function call (not a type conversion handled above)
			if c.analysis.IsAsyncFunc(c.pkg.TypesInfo.Uses[funIdent]) {
				c.tsw.WriteLiterally("await ")
			}
			if err := c.WriteValueExpr(expFun); err != nil { // Write function name/expression
				return fmt.Errorf("failed to write function expression in call: %w", err)
			}
			// Add "!" for function parameters that are function types
			if funType := c.pkg.TypesInfo.TypeOf(expFun); funType != nil {
				if _, ok := funType.Underlying().(*types.Signature); ok {
					if obj := c.pkg.TypesInfo.Uses[funIdent]; obj != nil {
						if _, isVar := obj.(*types.Var); isVar {
							c.tsw.WriteLiterally("!")
						}
					} else if _, isNamed := funType.(*types.Named); isNamed {
						// Also assert for named function types if they are directly used.
						c.tsw.WriteLiterally("!")
					}
				}
			}
		}
	} else {
		// 5. Not an *ast.Ident (e.g., selector expr for method calls, or func lit).
		// Logic for SelectorExpr (method calls) or FuncLit (IIFE).
		if selExpr, isSelExpr := expFun.(*ast.SelectorExpr); isSelExpr {
			// Check for async method call
			if ident, isIdent := selExpr.X.(*ast.Ident); isIdent {
				if obj := c.pkg.TypesInfo.Uses[ident]; obj != nil {
					if varObj, isVar := obj.(*types.Var); isVar {
						if namedType, isNamed := varObj.Type().(*types.Named); isNamed {
							typeName := namedType.Obj().Name()
							methodName := selExpr.Sel.Name
							if typePkg := namedType.Obj().Pkg(); typePkg != nil && typePkg != c.pkg.Types {
								if c.analysis.IsMethodAsync(typePkg.Name(), typeName, methodName) {
									c.tsw.WriteLiterally("await ")
								}
							}
						}
					}
				}
			}
			// Write method expression (e.g., obj.method or Class.staticMethod)
			if err := c.WriteValueExpr(expFun); err != nil {
				return fmt.Errorf("failed to write method expression in call: %w", err)
			}
		} else if _, isFuncLit := expFun.(*ast.FuncLit); isFuncLit {
			// Wrap function literal in parentheses for IIFE
			c.tsw.WriteLiterally("(")
			if err := c.WriteValueExpr(expFun); err != nil {
				return fmt.Errorf("failed to write function literal in call: %w", err)
			}
			c.tsw.WriteLiterally(")")
		} else {
			// Other function expression types (e.g., a call that returns a function)
			if err := c.WriteValueExpr(expFun); err != nil {
				return fmt.Errorf("failed to write function expression in call: %w", err)
			}
		}

		// Add "!" for function calls that return a function, or for method calls on nullable types.
		// This is a heuristic; more precise type checking might be needed.
		if funType := c.pkg.TypesInfo.TypeOf(expFun); funType != nil {
			if _, isSignature := funType.Underlying().(*types.Signature); isSignature {
				// If expFun itself is a CallExpr, or if its type is a named function type, assert non-null.
				if _, isCall := expFun.(*ast.CallExpr); isCall {
					c.tsw.WriteLiterally("!")
				} else if _, isNamed := funType.(*types.Named); isNamed {
					c.tsw.WriteLiterally("!")
				}
				// Note: The original code also had a check for ident within a signature,
				// but that's covered in the funIdent block.
			}
		}
	}

	// 6. Common argument writing for calls that proceed this far.
	c.tsw.WriteLiterally("(")
	for i, arg := range exp.Args {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		// Check if this is the last argument and we have ellipsis (variadic call)
		if exp.Ellipsis != token.NoPos && i == len(exp.Args)-1 {
			c.tsw.WriteLiterally("...")
		}
		if err := c.WriteValueExpr(arg); err != nil {
			return fmt.Errorf("failed to write argument %d in call: %w", i, err)
		}
		// Add non-null assertion for spread arguments that might be null
		if exp.Ellipsis != token.NoPos && i == len(exp.Args)-1 {
			// Check if the argument type is potentially nullable (slice)
			if argType := c.pkg.TypesInfo.TypeOf(arg); argType != nil {
				if _, isSlice := argType.Underlying().(*types.Slice); isSlice {
					c.tsw.WriteLiterally("!")
				}
			}
		}
	}
	c.tsw.WriteLiterally(")")
	return nil
}

// Note: Helper functions (hasSliceConstraint, getSliceElementTypeFromConstraint,
// hasMixedStringByteConstraint, getTypeHintForSliceElement) have been moved to
// compiler/expr-call-builtin.go
