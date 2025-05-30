package main

import "github.com/aperturerobotics/goscript/compliance/tests/rune_const_reference/subpkg"

func main() {
	// Test importing rune constants from another package
	const separator = subpkg.Separator
	const newline = subpkg.Newline

	// This should use the variable name instead of evaluating to numeric literal
	println("separator used in function:", useInFunction(separator))
	println("newline used in function:", useInFunction(newline))
}

func useInFunction(r rune) rune {
	return r + 1
}
