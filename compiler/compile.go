package compiler

// GoToTSCompiler compiles Go code to TypeScript code.
type GoToTSCompiler struct {
	tsw     *TSCodeWriter
	imports map[string]*fileImport
}

// NewGoToTSCompiler builds a new GoToTSCompiler
func NewGoToTSCompiler(tsw *TSCodeWriter) *GoToTSCompiler {
	return &GoToTSCompiler{tsw: tsw, imports: make(map[string]*fileImport)}
}
