package main

import "github.com/aperturerobotics/goscript/compliance/tests/rune_const_import/subpkg"

func main() {
	// Test importing rune constants from another package
	const separator = subpkg.Separator
	const newline = subpkg.Newline
	const space = subpkg.Space

	// Print the imported rune constants
	println("separator:", separator)
	println("newline:", newline)
	println("space:", space)

	// Use them in comparisons to ensure they're actually numbers
	if separator == '/' {
		println("separator matches '/'")
	}
	if newline == '\n' {
		println("newline matches '\\n'")
	}
	if space == ' ' {
		println("space matches ' '")
	}

	// Test arithmetic operations (only works with numbers)
	println("separator + 1:", separator+1)
	println("space - 1:", space-1)
}
