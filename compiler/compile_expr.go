package compiler

import (
	"fmt"
	"go/ast"
	"unicode"

	"github.com/paralin/goscript/types"
	"github.com/sanity-io/litter"
)

// WriteExpr writes an expression to the output.
func (c *GoToTSCompiler) WriteExpr(a ast.Expr, interpretType bool) {
	switch exp := a.(type) {
	case *ast.Ident:
		c.WriteExprIdent(exp, interpretType)
	case *ast.StructType:
		c.WriteExprStructType(exp)
	case *ast.StarExpr:
		c.WriteExprStar(exp, interpretType)
	case *ast.SelectorExpr:
		c.WriteExprSelector(exp, interpretType)
	case *ast.FuncType:
		c.WriteExprFunc(exp, interpretType)
	case *ast.CallExpr:
		c.WriteExprCall(exp)
	case *ast.UnaryExpr:
		c.WriteExprUnary(exp, interpretType)
	case *ast.BinaryExpr:
		c.WriteExprBinary(exp, interpretType)
	case *ast.BasicLit:
		c.WriteExprBasicLiteral(exp, interpretType)
	case *ast.CompositeLit:
		c.WriteExprCompositeLit(exp, interpretType)
	case *ast.KeyValueExpr:
		c.WriteExprKeyValue(exp, interpretType)
	default:
		c.tsw.WriteCommentLine(fmt.Sprintf("expr: %s", litter.Sdump(exp)))
	}
}

// Rewrite composite literals as inline object literals or constructor calls
func (c *GoToTSCompiler) WriteExprCompositeLit(exp *ast.CompositeLit, interpretType bool) {
	// if literal has a type (e.g., MyStruct{...}), emit constructor call
	if exp.Type != nil {
		// new Type({...})
		c.tsw.WriteLiterally("new ")
		c.WriteExpr(exp.Type, false)
		c.tsw.WriteLiterally("(")
		// object literal args
		c.tsw.WriteLiterally("{")
		for i, elm := range exp.Elts {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteExpr(elm, false)
		}
		c.tsw.WriteLiterally("}")
		c.tsw.WriteLiterally(")")
		return
	}
	// untyped literal: inline object
	c.tsw.WriteLiterally("{")
	for i, elm := range exp.Elts {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteExpr(elm, false)
	}
	c.tsw.WriteLiterally("}")
}

// WriteExprBasicLiteral writes a basic literal.
func (c *GoToTSCompiler) WriteExprBasicLiteral(exp *ast.BasicLit, interpretType bool) {
	// TODO: format certain kinds of values properly
	c.tsw.WriteLiterally(exp.Value)
}

// WriteExprCall writes a call expression.
func (c *GoToTSCompiler) WriteExprCall(exp *ast.CallExpr) {
	expFun := exp.Fun // ast.Expr
	if funIdent, funIsIdent := expFun.(*ast.Ident); funIsIdent && funIdent.String() == "println" {
		// rewrite println to console.log
		c.tsw.WriteLiterally("console.log")
	} else {
		// write the function call for non-printf cases
		c.WriteExpr(expFun, true)
	}

	c.tsw.WriteLiterally("(")
	for i, arg := range exp.Args {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteExpr(arg, false)
	}
	c.tsw.WriteLine(");")
	// c.tsw.WriteComment(fmt.Sprintf("expr: %s", litter.Sdump(exp)))
}

// WriteExprFunc writes a FuncType to the output
func (c *GoToTSCompiler) WriteExprFunc(exp *ast.FuncType, interpretType bool) {
	c.tsw.WriteLiterally("(")
	c.WriteFieldList(exp.Params, true)
	c.tsw.WriteLiterally(")")
}

// WriteExprSelector writes an expression selector.
func (c *GoToTSCompiler) WriteExprSelector(exp *ast.SelectorExpr, interpretType bool) {
	c.WriteExpr(exp.X, interpretType)
	c.tsw.WriteLiterally(".")
	sel := exp.Sel
	if sel.IsExported() {
		r := []rune(sel.Name)
		r[0] = unicode.ToLower(r[0])
		c.tsw.WriteLiterally(string(r))
	} else {
		c.WriteExpr(sel, interpretType)
	}
}

// WriteExprIdent writes an ident expr.
func (c *GoToTSCompiler) WriteExprIdent(exp *ast.Ident, interpretType bool) {
	name := exp.Name
	if interpretType {
		tsname, ok := types.GoBuiltinToTypescript(name)
		if ok {
			name = tsname
		} else {
			c.tsw.WriteCommentInline(fmt.Sprintf("unknown type: %q", name))
			return
		}
	}

	c.tsw.WriteLiterally(name)
	/*
		if exp.Obj != nil {
			c.tsw.WriteComment(litter.Sdump(exp.Obj))
		}
	*/
}

// WriteExprKeyValue writes a key value expression to the output.
func (c *GoToTSCompiler) WriteExprKeyValue(exp *ast.KeyValueExpr, interpretType bool) {
	if keyIdent, ok := exp.Key.(*ast.Ident); ok {
		r := []rune(keyIdent.Name)
		r[0] = unicode.ToLower(r[0])
		c.tsw.WriteLiterally(string(r))
	} else {
		c.WriteExpr(exp.Key, interpretType)
	}
	c.tsw.WriteLiterally(": ")
	c.WriteExpr(exp.Value, false)
}

// WriteExprStar writes a star expression.
func (c *GoToTSCompiler) WriteExprStar(exp *ast.StarExpr, interpretType bool) {
	// pointer dereference -> shallow clone
	c.WriteExpr(exp.X, false)
	c.tsw.WriteLiterally(".clone()")
}

// WriteExprStructType writes a structtype expr.
func (c *GoToTSCompiler) WriteExprStructType(exp *ast.StructType) {
	if exp.Fields == nil || exp.Fields.NumFields() == 0 {
		c.tsw.WriteLiterally("{}")
		return
	}

	c.WriteFieldList(exp.Fields, false)
}

// WriteExprUnary handles unary expressions like & and * by emitting the inner expression
func (c *GoToTSCompiler) WriteExprUnary(exp *ast.UnaryExpr, interpretType bool) {
	c.WriteExpr(exp.X, false)
}

// WriteExprBinary handles binary expressions
func (c *GoToTSCompiler) WriteExprBinary(exp *ast.BinaryExpr, interpretType bool) {
	c.WriteExpr(exp.X, false)
	c.tsw.WriteLiterally(" " + exp.Op.String() + " ")
	c.WriteExpr(exp.Y, false)
}
