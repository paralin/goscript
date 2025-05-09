// Generated file based on boxing_pointers.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	// x is boxed as p1 takes the address
	let x: $.Box<number> = $.box(10)
	// p1 is boxed as p2 takes the address
	let p1: $.Box<$.Box<number> | null> = $.box(x)
	// p2 is boxed as p3 takes the address
	let p2: $.Box<$.Box<$.Box<number> | null> | null> = $.box(p1)
	// p3 is not boxed as nothing takes its address
	let p3: $.Box<$.Box<$.Box<number> | null> | null> | null = p2

	console.log("***p3 before ==", p3!.value!.value!.value);

	// Dereference multiple times, this should be:
	// Goal: p3!.value!.value!.value = 12
	// Current: p3!.value = 12
	// Issue: only the bottom-most level of the WriteStarExpr checks p3 for boxing generating .value
	// How do we know that *p3 needs .value?
	p3!.value!.value!.value = 12
	console.log("***p3 after ==", p3!.value!.value!.value);
}

