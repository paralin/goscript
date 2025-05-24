// Generated file based on assign_op.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	let a: number = 5
	a += 3
	console.log(a) // Expected output: 8

	let b: number = 10
	b -= 2
	console.log(b) // Expected output: 8

	let c: number = 16
	c /= 4
	console.log(c) // Expected output: 4

	let d: number = 3
	d *= 5
	console.log(d) // Expected output: 15

	let e: number = 10
	e %= 3
	console.log(e) // Expected output: 1

	let f: number = 5
	f &= 3 // 101 & 011 = 001
	console.log(f) // Expected output: 1

	let g: number = 5
	g |= 3 // 101 | 011 = 111
	console.log(g) // Expected output: 7

	let h: number = 5
	h ^= 3 // 101 ^ 011 = 110
	console.log(h) // Expected output: 6

	// This operation is not yet supported.
	// var i int = 5
	// i &^= 3    // 101 &^ 011 = 101 & (~011) = 101 & 100 = 100
	// println(i) // Expected output: 4

	let j: number = 5
	j <<= 1 // 101 << 1 = 1010
	console.log(j) // Expected output: 10

	let k: number = 5
	k >>= 1 // 101 >> 1 = 010
	console.log(k) // Expected output: 2
}

