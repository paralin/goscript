package compiler

import (
	"sync"
)

// GoToTSCompiler compiles Go code to TypeScript code.
type GoToTSCompiler struct {
	tsw     *TSCodeWriter
	imports sync.Map // map[string]*fileImport
}

// NewGoToTSCompiler builds a new GoToTSCompiler
func NewGoToTSCompiler(tsw *TSCodeWriter) *GoToTSCompiler {
	return &GoToTSCompiler{tsw: tsw}
}
