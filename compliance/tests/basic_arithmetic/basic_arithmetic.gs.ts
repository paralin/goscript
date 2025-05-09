// Generated file based on basic_arithmetic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	// === Basic Arithmetic ===
	let add = 2 + 3
	let sub = 10 - 4
	let mul = 6 * 7
	let div = 20 / 5
	let mod = 17 % 3
	$.println("Addition: Expected: 5, Actual:", add)
	$.println("Subtraction: Expected: 6, Actual:", sub)
	$.println("Multiplication: Expected: 42, Actual:", mul)
	$.println("Division: Expected: 4, Actual:", div)
	$.println("Modulus: Expected: 2, Actual:", mod)
}

