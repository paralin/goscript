package compiler

// CompilerContext is the context for the compiler.
type CompilerContext struct {
	// GoPackage is the name of the go package to compile
	GoPackage string
	// ComputedTsPackage is the path to the typescript package for this Go package.
	ComputedTsPackage string
}
