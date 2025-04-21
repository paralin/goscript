package compiler

import (
	"golang.org/x/tools/go/packages"
)

// GoToTSCompiler compiles Go code to TypeScript code.
type GoToTSCompiler struct {
	tsw     *TSCodeWriter
	imports map[string]*fileImport
	pkg     *packages.Package
}

// NewGoToTSCompiler builds a new GoToTSCompiler
func NewGoToTSCompiler(tsw *TSCodeWriter, pkg *packages.Package) *GoToTSCompiler {
	return &GoToTSCompiler{tsw: tsw, imports: make(map[string]*fileImport), pkg: pkg}
}
