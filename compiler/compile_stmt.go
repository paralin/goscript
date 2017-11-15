package compiler

import (
	"fmt"
	"go/ast"

	"github.com/sanity-io/litter"
)

// WriteStmt writes a statement to the output.
func (c *GoToTSCompiler) WriteStmt(a ast.Stmt) {
	switch exp := a.(type) {
	case *ast.BlockStmt:
		c.WriteStmtBlock(exp)
	case *ast.AssignStmt:
		c.WriteStmtAssign(exp)
	case *ast.ReturnStmt:
		c.WriteStmtReturn(exp)
	case *ast.IfStmt:
		c.WriteStmtIf(exp)
	case *ast.ExprStmt:
		c.WriteStmtExpr(exp)
	default:
		c.tsw.WriteComment(fmt.Sprintf("unknown statement: %s\n", litter.Sdump(a)))
	}
}

// WriteStmtIf writes an if statement.
func (s *GoToTSCompiler) WriteStmtIf(exp *ast.IfStmt) {
	if exp.Init != nil {
		s.tsw.WriteLiterally("{")
		s.tsw.Indent(1)

		s.WriteStmt(exp.Init)

		defer func() {
			s.tsw.Indent(-1)
			s.tsw.WriteLiterally("}")
		}()
	}

	s.tsw.WriteLiterally("if (")
	s.WriteExpr(exp.Cond, true)
	s.tsw.WriteLiterally(") ")

	if exp.Body != nil {
		s.tsw.WriteLine("{")
		s.tsw.Indent(1)
		s.WriteStmtBlock(exp.Body)
		s.tsw.Indent(-1)
		s.tsw.WriteLine("}")
	} else {
		s.tsw.WriteLine("{}")
	}
}

// WriteStmtReturn writes a return statement.
func (c *GoToTSCompiler) WriteStmtReturn(exp *ast.ReturnStmt) {
	c.tsw.WriteLiterally("return ")
	for i, res := range exp.Results {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteExpr(res, false)
	}
}

// WriteStmtBlock writes a block statement.
func (c *GoToTSCompiler) WriteStmtBlock(exp *ast.BlockStmt) {
	if exp.Lbrace.IsValid() {
		c.tsw.WriteLine("{")
		c.tsw.Indent(1)
	}
	for _, stmt := range exp.List {
		c.WriteStmt(stmt)
	}
	if exp.Rbrace.IsValid() {
		c.tsw.Indent(-1)
		c.tsw.WriteLine("}")
	}
}

/*TODO:

// CompilePackage attempts to build a particular package in the gopath.
Compiler.prototype.CompilePackage = function(ctx: context.Context, pkgPath: string) {
	pkgCompiler, err = // expr: &ast.CallExpr{

figure out how to determine if let is required here

*/

// WriteStmtAssign writes an assign statement.
func (c *GoToTSCompiler) WriteStmtAssign(exp *ast.AssignStmt) {
	// TODO: determine if anything special is required here
	for i, l := range exp.Lhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteExpr(l, true)
	}
	c.tsw.WriteLiterally(" = ")
	for _, r := range exp.Rhs {
		c.WriteExpr(r, true)
	}
}

// WriteStmtExpr writes an expr statement.
func (c *GoToTSCompiler) WriteStmtExpr(exp *ast.ExprStmt) {
	c.WriteExpr(exp.X, true)
}
