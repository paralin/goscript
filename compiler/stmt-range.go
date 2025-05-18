package compiler

import (
	"fmt"
	"go/ast"
	"go/types"

	"github.com/pkg/errors"
)

// WriteStmtRange translates a Go `for...range` statement (`ast.RangeStmt`)
// into an equivalent TypeScript loop. The translation depends on the type of
// the expression being ranged over (`exp.X`), determined using `go/types` info.
//
//   - **Maps (`*types.Map`):**
//     `for k, v := range myMap` becomes `for (const [k_ts, v_ts] of myMap_ts.entries()) { const k = k_ts; const v = v_ts; ...body... }`.
//     If only `k` or `v` (or neither) is used, the corresponding TypeScript const declaration is adjusted.
//
//   - **Strings (`*types.Basic` with `IsString` info):**
//     `for i, r := range myString` becomes:
//     `const _runes = $.stringToRunes(myString_ts);`
//     `for (let i_ts = 0; i_ts < _runes.length; i_ts++) { const r_ts = _runes[i_ts]; ...body... }`.
//     The index variable `i_ts` uses the Go key variable name if provided (and not `_`).
//     The rune variable `r_ts` uses the Go value variable name.
//
//   - **Integers (`*types.Basic` with `IsInteger` info, Go 1.22+):**
//     `for i := range N` becomes `for (let i_ts = 0; i_ts < N_ts; i_ts++) { ...body... }`.
//     `for i, v := range N` becomes `for (let i_ts = 0; i_ts < N_ts; i_ts++) { const v_ts = i_ts; ...body... }`.
//
// - **Arrays (`*types.Array`) and Slices (`*types.Slice`):**
//   - If both key (index) and value are used (`for i, val := range arr`):
//     `for (let i_ts = 0; i_ts < arr_ts.length; i_ts++) { const val_ts = arr_ts[i_ts]; ...body... }`.
//   - If only the key (index) is used (`for i := range arr`):
//     `for (let i_ts = 0; i_ts < arr_ts.length; i_ts++) { ...body... }`.
//   - If only the value is used (`for _, val := range arr`):
//     `for (const v_ts of arr_ts) { const val_ts = v_ts; ...body... }`.
//   - If neither is used (e.g., `for range arr`), a simple index loop `for (let _i = 0; ...)` is generated.
//     The index variable `i_ts` uses the Go key variable name if provided.
//
// Loop variables (`exp.Key`, `exp.Value`) are declared as `const` inside the loop
// body if they are not blank identifiers (`_`). The loop body (`exp.Body`) is
// translated using `WriteStmtBlock` (or `WriteStmt` for array/slice with key and value).
// If the ranged type is not supported, a comment is written, and an error is returned.
func (c *GoToTSCompiler) WriteStmtRange(exp *ast.RangeStmt) error {
	// Get the type of the iterable expression
	iterType := c.pkg.TypesInfo.TypeOf(exp.X)
	underlying := iterType.Underlying()

	// Handle map types
	if _, ok := underlying.(*types.Map); ok {
		// Use for-of with entries() for proper Map iteration
		c.tsw.WriteLiterally("for (const [k, v] of ")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return fmt.Errorf("failed to write range loop map expression: %w", err)
		}
		c.tsw.WriteLiterally(".entries()) {")
		c.tsw.Indent(1)
		c.tsw.WriteLine("")
		// If a key variable is provided and is not blank, declare it as a constant
		if exp.Key != nil {
			if ident, ok := exp.Key.(*ast.Ident); ok && ident.Name != "_" {
				c.tsw.WriteLiterally("const ")
				c.WriteIdent(ident, false)
				c.tsw.WriteLiterally(" = k")
				c.tsw.WriteLine("")
			}
		}
		// If a value variable is provided and is not blank, use the value from entries()
		if exp.Value != nil {
			if ident, ok := exp.Value.(*ast.Ident); ok && ident.Name != "_" {
				c.tsw.WriteLiterally("const ")
				c.WriteIdent(ident, false)
				c.tsw.WriteLiterally(" = v")
				c.tsw.WriteLine("")
			}
		}
		// Write the loop body
		if err := c.WriteStmtBlock(exp.Body, false); err != nil {
			return fmt.Errorf("failed to write range loop map body: %w", err)
		}
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}")
		return nil
	}

	// Handle basic types (string, integer)
	if basic, ok := underlying.(*types.Basic); ok {
		if basic.Info()&types.IsString != 0 {
			// Add a scope to avoid collision of _runes variable
			c.tsw.WriteLine("{")
			c.tsw.Indent(1)

			// Convert the string to runes using $.stringToRunes
			c.tsw.WriteLiterally("const _runes = $.stringToRunes(")
			if err := c.WriteValueExpr(exp.X); err != nil {
				return fmt.Errorf("failed to write range loop string conversion expression: %w", err)
			}
			c.tsw.WriteLiterally(")")
			c.tsw.WriteLine("")

			// Determine the index variable name for the generated loop
			indexVarName := "i" // Default name
			if exp.Key != nil {
				if keyIdent, ok := exp.Key.(*ast.Ident); ok && keyIdent.Name != "_" {
					indexVarName = keyIdent.Name
				}
			}
			c.tsw.WriteLiterallyf("for (let %s = 0; %s < _runes.length; %s++) {", indexVarName, indexVarName, indexVarName)
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			// Declare value if provided and not blank
			if exp.Value != nil {
				if ident, ok := exp.Value.(*ast.Ident); ok && ident.Name != "_" {
					c.tsw.WriteLiterally("const ")
					c.WriteIdent(ident, false)
					c.tsw.WriteLiterally(" = _runes[i]") // TODO: should be indexVarName?
					c.tsw.WriteLine("")
				}
			}
			if err := c.WriteStmtBlock(exp.Body, false); err != nil {
				return fmt.Errorf("failed to write range loop string body: %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")

			// outer }
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		} else if basic.Info()&types.IsInteger != 0 {
			// Handle ranging over an integer (Go 1.22+)
			// Determine the index variable name for the generated loop
			indexVarName := "_i" // Default name
			if exp.Key != nil {
				if keyIdent, ok := exp.Key.(*ast.Ident); ok && keyIdent.Name != "_" {
					indexVarName = keyIdent.Name
				}
			}

			c.tsw.WriteLiterallyf("for (let %s = 0; %s < ", indexVarName, indexVarName)
			if err := c.WriteValueExpr(exp.X); err != nil { // This is N
				return fmt.Errorf("failed to write range loop integer expression: %w", err)
			}
			c.tsw.WriteLiterallyf("; %s++) {", indexVarName)
			c.tsw.Indent(1)
			c.tsw.WriteLine("")

			// The value variable is not allowed ranging over an integer.
			if exp.Value != nil {
				return errors.Errorf("ranging over an integer supports key variable only (not value variable): %v", exp)
			}

			if err := c.WriteStmtBlock(exp.Body, false); err != nil {
				return fmt.Errorf("failed to write range loop integer body: %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		}
	}

	// Handle array and slice types
	_, isSlice := underlying.(*types.Slice)
	_, isArray := underlying.(*types.Array)
	if isArray || isSlice {
		// Determine the index variable name for the generated loop
		indexVarName := "i" // Default name
		if exp.Key != nil {
			if keyIdent, ok := exp.Key.(*ast.Ident); ok && keyIdent.Name != "_" {
				indexVarName = keyIdent.Name
			}
		}
		// If both key and value are provided, use an index loop and assign both
		if exp.Key != nil && exp.Value != nil {
			c.tsw.WriteLiterallyf("for (let %s = 0; %s < $.len(", indexVarName, indexVarName)
			if err := c.WriteValueExpr(exp.X); err != nil { // Write the expression for the iterable
				return fmt.Errorf("failed to write range loop array/slice expression (key and value): %w", err)
			}
			c.tsw.WriteLiterallyf("); %s++) {", indexVarName)
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			// Declare value if not blank
			if ident, ok := exp.Value.(*ast.Ident); ok && ident.Name != "_" {
				c.tsw.WriteLiterally("const ")
				c.WriteIdent(ident, false)
				c.tsw.WriteLiterally(" = ")
				if err := c.WriteValueExpr(exp.X); err != nil {
					return fmt.Errorf("failed to write range loop array/slice value expression: %w", err)
				}
				c.tsw.WriteLiterallyf("![%s]", indexVarName) // Use indexVarName with not-null assert
				c.tsw.WriteLine("")
			}
			if err := c.WriteStmt(exp.Body); err != nil {
				return fmt.Errorf("failed to write range loop array/slice body (key and value): %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		} else if exp.Key != nil && exp.Value == nil { // Only key provided
			c.tsw.WriteLiterallyf("for (let %s = 0; %s < $.len(", indexVarName, indexVarName)
			// Write the expression for the iterable
			if err := c.WriteValueExpr(exp.X); err != nil {
				return fmt.Errorf("failed to write expression for the iterable: %w", err)
			}
			c.tsw.WriteLiterallyf("); %s++) {", indexVarName)
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			if err := c.WriteStmtBlock(exp.Body, false); err != nil {
				return fmt.Errorf("failed to write range loop array/slice body (only key): %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		} else if exp.Key == nil && exp.Value != nil { // Only value provided
			// I think this is impossible. See for_range_value_only test.
			return errors.Errorf("unexpected value without key in for range expression: %v", exp)
		} else {
			// Fallback: simple index loop without declaring range variables, use _i
			indexVarName := "_i"
			c.tsw.WriteLiterallyf("for (let %s = 0; %s < $.len(", indexVarName, indexVarName)
			if err := c.WriteValueExpr(exp.X); err != nil {
				return fmt.Errorf("failed to write range loop array/slice length expression (fallback): %w", err)
			}
			c.tsw.WriteLiterallyf("); %s++) {", indexVarName)
			c.tsw.Indent(1)
			c.tsw.WriteLine("")
			if err := c.WriteStmtBlock(exp.Body, false); err != nil {
				return fmt.Errorf("failed to write range loop array/slice body (fallback): %w", err)
			}
			c.tsw.Indent(-1)
			c.tsw.WriteLine("}")
			return nil
		}
	}

	return errors.Errorf("unsupported range loop type: %T for expression %v", underlying, exp)
}
