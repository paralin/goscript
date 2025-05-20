package compiler

import (
	"go/ast"
)

// WriteValueExpr translates a Go abstract syntax tree (AST) expression (`ast.Expr`)
// that represents a value into its TypeScript value equivalent.
// This is a central dispatch function for various expression types:
// - Identifiers (`ast.Ident`): Delegates to `WriteIdent`, potentially adding `.value` for boxed variables.
// - Selector expressions (`ast.SelectorExpr`, e.g., `obj.Field` or `pkg.Var`): Delegates to `WriteSelectorExpr`.
// - Pointer dereferences (`ast.StarExpr`, e.g., `*ptr`): Delegates to `WriteStarExpr`.
// - Function calls (`ast.CallExpr`): Delegates to `WriteCallExpr`.
// - Unary operations (`ast.UnaryExpr`, e.g., `!cond`, `&val`): Delegates to `WriteUnaryExpr`.
// - Binary operations (`ast.BinaryExpr`, e.g., `a + b`): Delegates to `WriteBinaryExpr`.
// - Basic literals (`ast.BasicLit`, e.g., `123`, `"hello"`): Delegates to `WriteBasicLit`.
// - Composite literals (`ast.CompositeLit`, e.g., `MyStruct{}`): Delegates to `WriteCompositeLit`.
// - Key-value expressions (`ast.KeyValueExpr`): Delegates to `WriteKeyValueExpr`.
// - Type assertions in expression context (`ast.TypeAssertExpr`, e.g., `val.(Type)`): Delegates to `WriteTypeAssertExpr`.
// - Index expressions (`ast.IndexExpr`):
//   - For maps: `myMap[key]` becomes `myMap.get(key) ?? zeroValue`.
//   - For arrays/slices: `myArray[idx]` becomes `myArray![idx]`.
//
// - Slice expressions (`ast.SliceExpr`, e.g., `s[low:high:max]`): Translates to `$.slice(s, low, high, max)`.
// - Parenthesized expressions (`ast.ParenExpr`): Translates `(X)` to `(X)`.
// - Function literals (`ast.FuncLit`): Delegates to `WriteFuncLitValue`.
// Unhandled value expressions result in a comment.
func (c *GoToTSCompiler) WriteValueExpr(a ast.Expr) error {
	switch exp := a.(type) {
	case *ast.Ident:
		c.WriteIdent(exp, true) // adds .value accessor
		return nil
	case *ast.SelectorExpr:
		return c.WriteSelectorExpr(exp)
	case *ast.StarExpr:
		return c.WriteStarExpr(exp)
	case *ast.CallExpr:
		return c.WriteCallExpr(exp)
	case *ast.UnaryExpr:
		return c.WriteUnaryExpr(exp)
	case *ast.BinaryExpr:
		return c.WriteBinaryExpr(exp)
	case *ast.BasicLit:
		c.WriteBasicLit(exp)
		return nil
	case *ast.CompositeLit:
		return c.WriteCompositeLit(exp)
	case *ast.KeyValueExpr:
		return c.WriteKeyValueExpr(exp)
	case *ast.TypeAssertExpr:
		// Handle type assertion in an expression context
		return c.WriteTypeAssertExpr(exp)
	case *ast.IndexExpr:
		return c.WriteIndexExpr(exp)
	case *ast.SliceExpr:
		return c.WriteSliceExpr(exp)
	case *ast.ParenExpr:
		// Check if this is a nil pointer to struct type cast: (*struct{})(nil)
		if starExpr, isStarExpr := exp.X.(*ast.StarExpr); isStarExpr {
			if _, isStructType := starExpr.X.(*ast.StructType); isStructType {
				c.tsw.WriteLiterally("null")
				return nil
			}
		}

		// Check if this is a type cast with nil: (SomeType)(nil)
		if ident, isIdent := exp.X.(*ast.Ident); isIdent && ident.Name == "nil" {
			c.tsw.WriteLiterally("null")
			return nil
		}

		// Translate (X) to (X)
		// If we haven't written anything in this statement yet, prepend ;
		c.tsw.WriteLiterally("(")
		if err := c.WriteValueExpr(exp.X); err != nil {
			return err
		}
		c.tsw.WriteLiterally(")")
		return nil
	case *ast.FuncLit:
		return c.WriteFuncLitValue(exp)
	default:
		c.tsw.WriteCommentLinef("unhandled value expr: %T", exp)
		return nil
	}
}
