// Generated file based on assign_op.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let a: number = 5
	a += 3
	$.println(a) // Expected output: 8

	let b: number = 10
	b -= 2
	$.println(b) // Expected output: 8

	let c: number = 16
	c /= 4
	$.println(c) // Expected output: 4

	let d: number = 3
	d *= 5
	$.println(d) // Expected output: 15

	let e: number = 10
	e %= 3
	$.println(e) // Expected output: 1

	let f: number = 5
	f &= 3
	$.println(f) // Expected output: 1

	let g: number = 5
	g |= 3
	$.println(g) // Expected output: 7

	let h: number = 5
	h ^= 3
	$.println(h) // Expected output: 6

	// This operation is not yet supported.
	// var i int = 5
	// i &^= 3    // 101 &^ 011 = 101 & (~011) = 101 & 100 = 100
	// println(i) // Expected output: 4

	let j: number = 5
	j <<= 1
	$.println(j) // Expected output: 10

	let k: number = 5
	k >>= 1
	$.println(k) // Expected output: 2
}

