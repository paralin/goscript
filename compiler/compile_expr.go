package compiler

import (
	"fmt"
	"go/ast"

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
	//case *ast.UnaryExpr:
	case *ast.BasicLit:
		c.WriteExprBasicLiteral(exp, interpretType)
	case *ast.CompositeLit:
		c.WriteExprCompositeLit(exp, interpretType)
	case *ast.KeyValueExpr:
		c.WriteExprKeyValue(exp, interpretType)
	default:
		c.tsw.WriteComment(fmt.Sprintf("expr: %s", litter.Sdump(exp)))
	}
}

// WriteExprCompositeLit writes a composite literal expression.
func (c *GoToTSCompiler) WriteExprCompositeLit(exp *ast.CompositeLit, interpretType bool) {
	c.WriteExpr(exp.Type, interpretType)
	c.tsw.WriteLiterally("{")
	if len(exp.Elts) > 0 {
		c.tsw.WriteLine("")
		c.tsw.Indent(1)
		for _, elm := range exp.Elts {
			c.WriteExpr(elm, interpretType)
		}
		c.tsw.Indent(-1)
	}
	c.tsw.WriteLine("}")
}

// WriteExprBasicLiteral writes a basic literal.
func (c *GoToTSCompiler) WriteExprBasicLiteral(exp *ast.BasicLit, interpretType bool) {
	// TODO: format certain kinds of values properly
	c.tsw.WriteLiterally(exp.Value)
}

// WriteExprCall writes a call expression.
func (c *GoToTSCompiler) WriteExprCall(exp *ast.CallExpr) {
	c.WriteExpr(exp.Fun, true)
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
	c.WriteExpr(exp.Sel, interpretType)
}

// WriteExprIdent writes an ident expr.
func (c *GoToTSCompiler) WriteExprIdent(exp *ast.Ident, interpretType bool) {
	name := exp.Name
	if interpretType {
		tsname, ok := types.GoBuiltinToTypescript(name)
		if ok {
			name = tsname
		} /* else {
			c.tsw.WriteComment(fmt.Sprintf("unknown type: %s", name))
			return
		}*/
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
	c.WriteExpr(exp.Key, interpretType)
	c.tsw.WriteLiterally(": ")
	c.WriteExpr(exp.Value, interpretType)
}

// WriteExprStar writes a star expression.
func (c *GoToTSCompiler) WriteExprStar(exp *ast.StarExpr, interpretType bool) {
	// todo: determine pointers and copy on write
	c.WriteExpr(exp.X, interpretType)
}

// WriteExprStructType writes a structtype expr.
func (c *GoToTSCompiler) WriteExprStructType(exp *ast.StructType) {
	if exp.Fields == nil || exp.Fields.NumFields() == 0 {
		c.tsw.WriteLiterally("{}")
		return
	}

	c.WriteFieldList(exp.Fields, false)
}
