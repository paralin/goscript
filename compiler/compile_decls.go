package compiler

import (
	"go/ast"

	"github.com/sanity-io/litter"
)

// WriteDecls writes a slice of declarations.
func (c *GoToTSCompiler) WriteDecls(decls []ast.Decl) {
	cw := c.tsw
	for _, decl := range decls {
		switch d := decl.(type) {
		case *ast.GenDecl:
			if d.Doc != nil {
				c.WriteDoc(d.Doc)
			}
			for _, spec := range d.Specs {
				c.WriteSpec(spec)
			}
		case *ast.FuncDecl:
			c.WriteDeclFunc(d)
		default:
			cw.WriteComment(litter.Sdump(decl))
		}
		cw.WriteSectionTail()
	}
}

// WriteDeclFunc writes a function declaration
func (c *GoToTSCompiler) WriteDeclFunc(decl *ast.FuncDecl) {
	if decl.Doc != nil {
		c.WriteDoc(decl.Doc)
	}
	// TODO: bind this to recv name
	isRecv := decl.Recv != nil && len(decl.Recv.List) > 0
	isExport := decl.Name.IsExported()
	if isRecv {
		c.WriteExpr(decl.Recv.List[0].Type, false)
		c.tsw.WriteLiterally(".prototype.")
		c.WriteExpr(decl.Name, false)
		c.tsw.WriteLiterally(" = ")
	} else if isExport || decl.Name.String() == "main" || decl.Name.String() == "init" {
		c.tsw.WriteLiterally("export ")
	}
	c.tsw.WriteLiterally("function")
	if decl.Name != nil && !isRecv {
		c.tsw.WriteLiterally(" ")
		c.WriteExpr(decl.Name, false)
	}
	c.WriteExpr(decl.Type, false)
	c.tsw.WriteLiterally(" ")
	c.WriteStmt(decl.Body)
}
