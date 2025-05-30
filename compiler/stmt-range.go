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

	// Handle map types (both concrete maps and type parameters constrained to maps)
	if c.isMapType(iterType, underlying) {
		return c.writeMapRange(exp)
	}

	// Handle basic types (string, integer)
	if basic, ok := underlying.(*types.Basic); ok {
		if basic.Info()&types.IsString != 0 {
			return c.writeStringRange(exp)
		} else if basic.Info()&types.IsInteger != 0 {
			return c.writeIntegerRange(exp)
		}
	}

	// Handle array and slice types
	if c.isArrayOrSlice(underlying) {
		return c.writeArraySliceRange(exp, false)
	}

	// Handle pointer to array/slice types
	if ptrType, ok := underlying.(*types.Pointer); ok {
		elem := ptrType.Elem().Underlying()
		if c.isArrayOrSlice(elem) {
			return c.writeArraySliceRange(exp, true)
		}
	}

	// Handle iterator function signatures
	if sig, ok := underlying.(*types.Signature); ok {
		if c.isIteratorSignature(sig) {
			return c.writeIteratorRange(exp, sig)
		}
	}

	// Handle interface types that may represent iterators
	if _, ok := underlying.(*types.Interface); ok {
		return c.writeInterfaceIteratorRange(exp)
	}

	return errors.Errorf("unsupported range loop type: %T for expression %v", underlying, exp)
}

// Helper functions

func (c *GoToTSCompiler) isMapType(iterType, underlying types.Type) bool {
	if _, ok := underlying.(*types.Map); ok {
		return true
	}
	if typeParam, isTypeParam := iterType.(*types.TypeParam); isTypeParam {
		constraint := typeParam.Constraint()
		if constraint != nil {
			constraintUnderlying := constraint.Underlying()
			if iface, isInterface := constraintUnderlying.(*types.Interface); isInterface {
				return hasMapConstraint(iface)
			}
		}
	}
	return false
}

func (c *GoToTSCompiler) isArrayOrSlice(underlying types.Type) bool {
	_, isSlice := underlying.(*types.Slice)
	_, isArray := underlying.(*types.Array)
	return isArray || isSlice
}

func (c *GoToTSCompiler) isIteratorSignature(sig *types.Signature) bool {
	params := sig.Params()
	if params.Len() != 1 {
		return false
	}
	yieldParam := params.At(0).Type()
	if yieldSig, ok := yieldParam.Underlying().(*types.Signature); ok {
		yieldResults := yieldSig.Results()
		if yieldResults.Len() == 1 {
			if basic, ok := yieldResults.At(0).Type().Underlying().(*types.Basic); ok && basic.Kind() == types.Bool {
				return true
			}
		}
	}
	return false
}

func (c *GoToTSCompiler) getIndexVarName(exp *ast.RangeStmt, defaultName string) string {
	if exp.Key != nil {
		if keyIdent, ok := exp.Key.(*ast.Ident); ok && keyIdent.Name != "_" {
			return keyIdent.Name
		}
	}
	return defaultName
}

func (c *GoToTSCompiler) writeMapRange(exp *ast.RangeStmt) error {
	keyVarName := "_k"
	valueVarName := "_v"

	if exp.Key != nil {
		if ident, ok := exp.Key.(*ast.Ident); ok && ident.Name != "_" {
			keyVarName = ident.Name
		}
	}
	if exp.Value != nil {
		if ident, ok := exp.Value.(*ast.Ident); ok && ident.Name != "_" {
			valueVarName = ident.Name
		}
	}

	c.tsw.WriteLiterallyf("for (const [%s, %s] of ", keyVarName, valueVarName)
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write range loop map expression: %w", err)
	}
	c.tsw.WriteLiterally("?.entries() ?? []) {")
	c.tsw.Indent(1)
	c.tsw.WriteLine("")

	if err := c.WriteStmtBlock(exp.Body, false); err != nil {
		return fmt.Errorf("failed to write range loop map body: %w", err)
	}
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

func (c *GoToTSCompiler) writeStringRange(exp *ast.RangeStmt) error {
	c.tsw.WriteLine("{")
	c.tsw.Indent(1)

	c.tsw.WriteLiterally("const _runes = $.stringToRunes(")
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write range loop string conversion expression: %w", err)
	}
	c.tsw.WriteLiterally(")")
	c.tsw.WriteLine("")

	indexVarName := c.getIndexVarName(exp, "i")
	c.tsw.WriteLiterallyf("for (let %s = 0; %s < _runes.length; %s++) {", indexVarName, indexVarName, indexVarName)
	c.tsw.Indent(1)
	c.tsw.WriteLine("")

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
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

func (c *GoToTSCompiler) writeIntegerRange(exp *ast.RangeStmt) error {
	if exp.Value != nil {
		return errors.Errorf("ranging over an integer supports key variable only (not value variable): %v", exp)
	}

	indexVarName := c.getIndexVarName(exp, "_i")
	c.tsw.WriteLiterallyf("for (let %s = 0; %s < ", indexVarName, indexVarName)
	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write range loop integer expression: %w", err)
	}
	c.tsw.WriteLiterallyf("; %s++) {", indexVarName)

	if err := c.WriteStmtBlock(exp.Body, false); err != nil {
		return fmt.Errorf("failed to write range loop integer body: %w", err)
	}

	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

func (c *GoToTSCompiler) writeArraySliceRange(exp *ast.RangeStmt, isPointer bool) error {
	indexVarName := c.getIndexVarName(exp, "_i")

	// Handle the different cases
	if exp.Key != nil && exp.Value != nil {
		return c.writeArraySliceWithKeyValue(exp, indexVarName, isPointer)
	} else if exp.Key != nil && exp.Value == nil {
		return c.writeArraySliceKeyOnly(exp, indexVarName, isPointer)
	} else if exp.Key == nil && exp.Value != nil {
		return errors.Errorf("unexpected value without key in for range expression: %v", exp)
	} else {
		return c.writeArraySliceFallback(exp, isPointer)
	}
}

func (c *GoToTSCompiler) writeArraySliceWithKeyValue(exp *ast.RangeStmt, indexVarName string, isPointer bool) error {
	c.tsw.WriteLiterallyf("for (let %s = 0; %s < $.len(", indexVarName, indexVarName)
	if err := c.writeArraySliceExpression(exp.X, isPointer); err != nil {
		return fmt.Errorf("failed to write range loop array/slice expression (key and value): %w", err)
	}
	c.tsw.WriteLiterallyf("); %s++) {", indexVarName)
	c.tsw.Indent(1)
	c.tsw.WriteLine("")

	if ident, ok := exp.Value.(*ast.Ident); ok && ident.Name != "_" {
		c.tsw.WriteLiterally("const ")
		c.WriteIdent(ident, false)
		c.tsw.WriteLiterally(" = ")
		if err := c.writeArraySliceExpression(exp.X, isPointer); err != nil {
			return fmt.Errorf("failed to write range loop array/slice value expression: %w", err)
		}
		c.tsw.WriteLiterallyf("![%s]", indexVarName)
		c.tsw.WriteLine("")
	}

	if err := c.WriteStmt(exp.Body); err != nil {
		return fmt.Errorf("failed to write range loop array/slice body (key and value): %w", err)
	}
	c.tsw.Indent(-1)
	c.tsw.WriteLine("}")
	return nil
}

func (c *GoToTSCompiler) writeArraySliceKeyOnly(exp *ast.RangeStmt, indexVarName string, isPointer bool) error {
	c.tsw.WriteLiterallyf("for (let %s = 0; %s < $.len(", indexVarName, indexVarName)
	if err := c.writeArraySliceExpression(exp.X, isPointer); err != nil {
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
}

func (c *GoToTSCompiler) writeArraySliceFallback(exp *ast.RangeStmt, isPointer bool) error {
	indexVarName := "_i"
	c.tsw.WriteLiterallyf("for (let %s = 0; %s < $.len(", indexVarName, indexVarName)
	if err := c.writeArraySliceExpression(exp.X, isPointer); err != nil {
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

func (c *GoToTSCompiler) writeArraySliceExpression(expr ast.Expr, isPointer bool) error {
	if isPointer {
		if ident, ok := expr.(*ast.Ident); ok {
			c.WriteIdent(ident, false)
		} else {
			if err := c.WriteValueExpr(expr); err != nil {
				return err
			}
		}
		c.tsw.WriteLiterally("!.value")
		return nil
	} else {
		return c.WriteValueExpr(expr)
	}
}

func (c *GoToTSCompiler) writeIteratorRange(exp *ast.RangeStmt, sig *types.Signature) error {
	params := sig.Params()
	yieldParam := params.At(0).Type()
	yieldSig := yieldParam.Underlying().(*types.Signature)
	yieldParams := yieldSig.Params()

	c.tsw.WriteLiterally(";(() => {")
	c.tsw.Indent(1)
	c.tsw.WriteLine("")
	c.tsw.WriteLiterally("let shouldContinue = true")
	c.tsw.WriteLine("")

	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write iterator expression: %w", err)
	}

	switch yieldParams.Len() {
	case 0:
		c.tsw.WriteLiterally("!(() => {")
	case 1:
		c.tsw.WriteLiterally("!((")
		c.writeIteratorParam(exp.Value, "v")
		c.tsw.WriteLiterally(") => {")
	case 2:
		c.tsw.WriteLiterally("!((")
		c.writeIteratorParam(exp.Key, "k")
		c.tsw.WriteLiterally(", ")
		c.writeIteratorParam(exp.Value, "v")
		c.tsw.WriteLiterally(") => {")
	}

	c.tsw.Indent(1)
	c.tsw.WriteLine("")
	if err := c.WriteStmtBlock(exp.Body, false); err != nil {
		return fmt.Errorf("failed to write iterator body: %w", err)
	}
	c.tsw.WriteLiterally("return shouldContinue")
	c.tsw.WriteLine("")
	c.tsw.Indent(-1)
	c.tsw.WriteLiterally("})")
	c.tsw.WriteLine("")
	c.tsw.Indent(-1)
	c.tsw.WriteLine("})()")
	return nil
}

func (c *GoToTSCompiler) writeIteratorParam(param ast.Expr, defaultName string) {
	if param != nil {
		if ident, ok := param.(*ast.Ident); ok && ident.Name != "_" {
			c.WriteIdent(ident, false)
			return
		}
	}
	c.tsw.WriteLiterally(defaultName)
}

func (c *GoToTSCompiler) writeInterfaceIteratorRange(exp *ast.RangeStmt) error {
	c.tsw.WriteLiterally(";(() => {")
	c.tsw.Indent(1)
	c.tsw.WriteLine("")
	c.tsw.WriteLiterally("let shouldContinue = true")
	c.tsw.WriteLine("")

	if err := c.WriteValueExpr(exp.X); err != nil {
		return fmt.Errorf("failed to write interface iterator expression: %w", err)
	}

	if exp.Key != nil && exp.Value != nil {
		c.tsw.WriteLiterally("!((")
		c.writeIteratorParam(exp.Key, "k")
		c.tsw.WriteLiterally(", ")
		c.writeIteratorParam(exp.Value, "v")
		c.tsw.WriteLiterally(") => {")
	} else if exp.Value != nil {
		c.tsw.WriteLiterally("!((")
		c.writeIteratorParam(exp.Value, "v")
		c.tsw.WriteLiterally(") => {")
	} else if exp.Key != nil {
		c.tsw.WriteLiterally("!((")
		c.writeIteratorParam(exp.Key, "k")
		c.tsw.WriteLiterally(") => {")
	} else {
		c.tsw.WriteLiterally("!(() => {")
	}

	c.tsw.Indent(1)
	c.tsw.WriteLine("")
	if err := c.WriteStmtBlock(exp.Body, false); err != nil {
		return fmt.Errorf("failed to write interface iterator body: %w", err)
	}
	c.tsw.WriteLiterally("return shouldContinue")
	c.tsw.WriteLine("")
	c.tsw.Indent(-1)
	c.tsw.WriteLiterally("})")
	c.tsw.WriteLine("")
	c.tsw.Indent(-1)
	c.tsw.WriteLine("})()")
	return nil
}
