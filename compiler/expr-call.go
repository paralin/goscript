package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"go/types"
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
