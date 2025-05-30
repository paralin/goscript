// Generated file based on rune_const_import.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as subpkg from "@goscript/github.com/aperturerobotics/goscript/compliance/tests/rune_const_import/subpkg/index.js"

export async function main(): Promise<void> {
	// Test importing rune constants from another package
	let separator: number = subpkg.Separator
	let newline: number = subpkg.Newline
	let space: number = subpkg.Space

	// Print the imported rune constants
	console.log("separator:", separator)
	console.log("newline:", newline)
	console.log("space:", space)

	// Use them in comparisons to ensure they're actually numbers
	if (separator == 47) {
		console.log("separator matches '/'")
	}
	if (newline == 10) {
		console.log("newline matches '\\n'")
	}
	if (space == 32) {
		console.log("space matches ' '")
	}

	// Test arithmetic operations (only works with numbers)
	console.log("separator + 1:", separator + 1)
	console.log("space - 1:", space - 1)
}

