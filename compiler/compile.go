package compiler

import (
	"go/ast"

	"golang.org/x/tools/go/packages"
)

// GoToTSCompiler compiles Go code to TypeScript code.
type GoToTSCompiler struct {
	tsw     *TSCodeWriter
	imports map[string]*fileImport
	pkg     *packages.Package
	cmap    ast.CommentMap
}

// NewGoToTSCompiler builds a new GoToTSCompiler
func NewGoToTSCompiler(tsw *TSCodeWriter, pkg *packages.Package, cmap ast.CommentMap) *GoToTSCompiler {
	return &GoToTSCompiler{
		tsw:     tsw,
		imports: make(map[string]*fileImport),
		pkg:     pkg,
		cmap:    cmap,
	}
}
