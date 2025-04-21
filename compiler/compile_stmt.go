package compiler

import (
	"fmt"
	"go/ast"
	"go/token"
	gtypes "go/types"

	"github.com/paralin/goscript/types"
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
		c.tsw.WriteCommentLine(fmt.Sprintf("unknown statement: %s\n", litter.Sdump(a)))
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
		s.WriteStmtBlock(exp.Body)
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
	c.tsw.WriteLine(";")
}

// WriteStmtBlock writes a block statement.
func (c *GoToTSCompiler) WriteStmtBlock(exp *ast.BlockStmt) {
	if exp == nil {
		c.tsw.WriteLine("{}")
		return
	}

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

// WriteStmtAssign writes an assign statement.
func (c *GoToTSCompiler) WriteStmtAssign(exp *ast.AssignStmt) {
	// skip blank-identifier assignments: ignore single `_ = ...` assignments
	if len(exp.Lhs) == 1 {
		if ident, ok := exp.Lhs[0].(*ast.Ident); ok && ident.Name == "_" {
			return
		}
	}
	// filter out blank identifiers for multi-value assignments: remove any `_` slots
	lhs, rhs := filterBlankIdentifiers(exp.Lhs, exp.Rhs)
	if len(lhs) == 0 {
		return
	}
	// special-case define assignments (`:=`):
	// - emit a TypeScript `let` declaration
	// - apply .clone() on non-pointer struct values for Go value-copy semantics
	if exp.Tok == token.DEFINE {
		c.tsw.WriteLiterally("let ")
		for i, l := range lhs {
			if i != 0 {
				c.tsw.WriteLiterally(", ")
			}
			c.WriteExpr(l, false)
			c.tsw.WriteLiterally(" = ")
			// clone value types for struct (shallow copy), keep pointers as-is
			if ident, ok := rhs[i].(*ast.Ident); ok {
				if tv, found := c.pkg.TypesInfo.Types[ident]; found {
					t := tv.Type
					// pointer types are direct assignment; non-pointers clone
					if _, isPtr := t.(*gtypes.Pointer); !isPtr {
						c.WriteExpr(ident, false)
						c.tsw.WriteLiterally(".clone()")
					} else {
						c.WriteExpr(ident, false)
					}
				} else {
					c.WriteExpr(ident, false)
				}
			} else {
				c.WriteExpr(rhs[i], false)
			}
		}
		c.tsw.WriteLine(";")
		return
	}
	// fallback for other assignment tokens (`=`, `+=`, etc):
	// - write LHS, operator mapping, and RHS expressions directly
	for i, l := range lhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteExpr(l, false)
	}
	c.tsw.WriteLiterally(" ")
	tokStr, ok := types.TokenToTs(exp.Tok)
	if !ok {
		c.tsw.WriteLiterally("?= ")
		c.tsw.WriteCommentLine("Unknown token " + exp.Tok.String())
	} else {
		c.tsw.WriteLiterally(tokStr)
	}
	c.tsw.WriteLiterally(" ")
	for i, r := range rhs {
		if i != 0 {
			c.tsw.WriteLiterally(", ")
		}
		c.WriteExpr(r, true)
	}
	c.tsw.WriteLine(";")
}

// WriteStmtExpr writes an expr statement.
func (c *GoToTSCompiler) WriteStmtExpr(exp *ast.ExprStmt) {
	c.WriteExpr(exp.X, true)
}

// WriteZeroValue writes the TypeScript zero‐value for a Go type.
func (c *GoToTSCompiler) WriteZeroValue(expr ast.Expr) {
	switch t := expr.(type) {
	case *ast.Ident:
		switch t.Name {
		case "int", "float64":
			c.tsw.WriteLiterally("0")
		case "string":
			c.tsw.WriteLiterally(`""`)
		case "bool":
			c.tsw.WriteLiterally("false")
		default:
			c.tsw.WriteLiterally("null")
		}
	default:
		// everything else defaults to null in TS
		c.tsw.WriteLiterally("null")
	}
}
