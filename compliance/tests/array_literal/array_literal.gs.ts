// Generated file based on array_literal.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export function main(): void {
	// Test basic array literal
	let a: number[] = [1, 2, 3];
	console.log(a[0], a[1], a[2])
	
	// Test array literal with inferred length
	let b = ["hello", "world"]
	console.log(b[0], b[1])
	
	// Test array literal with specific element initialization
	let c = [0, 10, 0, 30, 0]
	console.log(c[0], c[1], c[2], c[3], c[4])
}

