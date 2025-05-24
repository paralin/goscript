// Generated file based on basic_arithmetic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	// === Basic Arithmetic ===
	let add = 2 + 3
	let sub = 10 - 4
	let mul = 6 * 7
	let div = 20 / 5
	let mod = 17 % 3
	console.log("Addition: Expected: 5, Actual:", add)
	console.log("Subtraction: Expected: 6, Actual:", sub)
	console.log("Multiplication: Expected: 42, Actual:", mul)
	console.log("Division: Expected: 4, Actual:", div)
	console.log("Modulus: Expected: 2, Actual:", mod)
}

