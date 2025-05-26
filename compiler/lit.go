package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	"strconv"
)

// WriteBasicLit translates a Go basic literal (`ast.BasicLit`) into its
// TypeScript equivalent.
//   - Character literals (e.g., `'a'`, `'\n'`) are translated to their numeric
//     Unicode code point (e.g., `97`, `10`). Escape sequences are handled.
//   - Integer, float, imaginary, and string literals are written directly as their
//     `exp.Value` string, which typically corresponds to valid TypeScript syntax
//     (e.g., `123`, `3.14`, `"hello"`). Imaginary literals might need special
//     handling if they are to be fully supported beyond direct string output.
//   - Legacy octal literals (e.g., `0777`) are converted to modern TypeScript
//     octal syntax (e.g., `0o777`) to avoid ES module compatibility issues.
func (c *GoToTSCompiler) WriteBasicLit(exp *ast.BasicLit) {
	if exp.Kind == token.CHAR {
		// Go char literal 'x' is a rune (int32). Translate to its numeric code point.
		// Use strconv.UnquoteChar to handle escape sequences correctly.
		val, _, _, err := strconv.UnquoteChar(exp.Value[1:len(exp.Value)-1], '\'')
		if err != nil {
			c.tsw.WriteCommentInlinef("error parsing char literal %s: %v", exp.Value, err)
			c.tsw.WriteLiterally("0") // Default to 0 on error
		} else {
			c.tsw.WriteLiterallyf("%d", val)
		}
	} else if exp.Kind == token.INT {
		// Handle integer literals, including legacy octal conversion
		value := exp.Value

		// Check for legacy octal literals (starts with 0, followed by octal digits, but not 0x, 0b, or 0o)
		if len(value) > 1 && value[0] == '0' && value != "0" {
			// Check if it's already modern syntax (0x, 0b, 0o) or just legacy octal
			if len(value) > 2 && (value[1] == 'x' || value[1] == 'X' ||
				value[1] == 'b' || value[1] == 'B' ||
				value[1] == 'o' || value[1] == 'O') {
				// Already modern syntax (hex, binary, or modern octal), write as-is
				c.tsw.WriteLiterally(value)
			} else {
				// Check if all remaining characters are valid octal digits (0-7)
				isLegacyOctal := true
				for i := 1; i < len(value); i++ {
					if value[i] < '0' || value[i] > '7' {
						isLegacyOctal = false
						break
					}
				}

				if isLegacyOctal {
					// Convert legacy octal 0777 to modern octal 0o777
					c.tsw.WriteLiterallyf("0o%s", value[1:])
				} else {
					// Not a valid octal, write as-is (might be decimal with leading zero)
					c.tsw.WriteLiterally(value)
				}
			}
		} else {
			// Regular decimal integer or single zero, write as-is
			c.tsw.WriteLiterally(value)
		}
	} else {
		// Other literals (FLOAT, STRING, IMAG)
		c.tsw.WriteLiterally(exp.Value)
	}
}

// WriteFuncLitValue translates a Go function literal (`ast.FuncLit`) into a
// TypeScript arrow function.
// The translation results in: `[async] (param1: type1, ...) : returnType => { ...body... }`.
//   - The `async` keyword is prepended if `c.analysis.IsFuncLitAsync(exp)`
//     indicates the function literal contains asynchronous operations.
//   - Parameters are translated using `WriteFieldList`.
//   - The return type is determined similarly to `WriteFuncType`:
//   - `void` for no results.
//   - `resultType` for a single unnamed result.
//   - `[typeA, typeB]` for multiple or named results.
//   - Wrapped in `Promise<>` if `async`.
//   - The function body (`exp.Body`) is translated using `WriteStmt`.
func (c *GoToTSCompiler) WriteFuncLitValue(exp *ast.FuncLit) error {
	// Determine if the function literal should be async
	isAsync := c.analysis.IsFuncLitAsync(exp)

	if isAsync {
		c.tsw.WriteLiterally("async ")
	}

	// Write arrow function: (params) => { body }
	c.tsw.WriteLiterally("(")

	// Use WriteFieldList which now handles variadic parameters
	c.WriteFieldList(exp.Type.Params, true) // true = arguments

	c.tsw.WriteLiterally(")")

	// Handle return type for function literals
	if exp.Type.Results != nil && len(exp.Type.Results.List) > 0 {
		c.tsw.WriteLiterally(": ")
		if isAsync {
			c.tsw.WriteLiterally("Promise<")
		}
		if len(exp.Type.Results.List) == 1 && len(exp.Type.Results.List[0].Names) == 0 {
			c.WriteTypeExpr(exp.Type.Results.List[0].Type)
		} else {
			c.tsw.WriteLiterally("[")
			for i, field := range exp.Type.Results.List {
				if i > 0 {
					c.tsw.WriteLiterally(", ")
				}
				c.WriteTypeExpr(field.Type)
			}
			c.tsw.WriteLiterally("]")
		}
		if isAsync {
			c.tsw.WriteLiterally(">")
		}
	} else {
		if isAsync {
			c.tsw.WriteLiterally(": Promise<void>")
		} else {
			c.tsw.WriteLiterally(": void")
		}
	}

	c.tsw.WriteLiterally(" => ")

	hasNamedReturns := false
	if exp.Type.Results != nil {
		for _, field := range exp.Type.Results.List {
			if len(field.Names) > 0 {
				hasNamedReturns = true
				break
			}
		}
	}

	if hasNamedReturns {
		c.tsw.WriteLine("{")
		c.tsw.Indent(1)

		// Declare named return variables and initialize them to their zero values
		for _, field := range exp.Type.Results.List {
			for _, name := range field.Names {
				c.tsw.WriteLiterallyf("let %s: ", c.sanitizeIdentifier(name.Name))
				c.WriteTypeExpr(field.Type)
				c.tsw.WriteLiterally(" = ")
				c.WriteZeroValueForType(c.pkg.TypesInfo.TypeOf(field.Type))
				c.tsw.WriteLine("")
			}
		}
	}

	// Write function body
	if err := c.WriteStmtBlock(exp.Body, true); err != nil {
		return fmt.Errorf("failed to write block statement: %w", err)
	}

	if hasNamedReturns {
		c.tsw.Indent(-1)
		c.tsw.WriteLiterally("}")
	}

	return nil
}
