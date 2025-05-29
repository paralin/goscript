// Generated file based on bitwise_and_not_assignment.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Test the &^= operator (bit clear assignment)
	let x = (0x7FF0000000000000 as number) // Some bits set
	let mask = ((2047 << 52) as number) // Mask to clear

	console.log("Before:", x)
	x &= ~(mask) // This should generate valid TypeScript
	console.log("After:", x)

	// Also test regular &^ operator
	let y = (0x7FF0000000000000 as number)
	let result = (y & ~ mask)
	console.log("Result:", result)
}

