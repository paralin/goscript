// Generated file based on boxing_deref_set.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	// y is boxed because p1 takes its address
	let y: $.Box<number> = $.box(15)

	// p1 is boxed because p1_boxer takes its address
	let p1: $.Box<$.Box<number> | null> = $.box(null)
	// Ensure p1 is boxed
	let p1_boxer: $.Box<$.Box<number> | null> | null = p1
	/* _ = */ p1_boxer

	// Expected TS: p1.value = y
	p1!.value = y

	// Dereferencing p1 (boxed variable) to access y (boxed variable)
	// Go: println(*p1)
	// Expected TS for same behavior: console.log(p1.value.value)
	// We access p1 which should be p1.value. Then we dereference that, which should be p1.value.value.
	console.log(p1!.value!.value)

	// Set the value
	p1!.value!.value = 20
}

