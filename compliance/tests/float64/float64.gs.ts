// Generated file based on float64.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	//nolint:staticcheck
	let a: number = 1.23
	let b = 4.56
	let c: number = 0

	c = a + b
	$.println("a + b =", c)

	c = a - b
	$.println("a - b =", c)

	c = a * b
	$.println("a * b =", c)

	c = a / b
	$.println("a / b =", c)

	// Assignment
	let d = 7.89
	c = d
	$.println("c =", c)

	// More complex expression
	let e = (a + b) * (c - d) / a
	$.println("(a + b) * (c - d) / a =", e)
}

