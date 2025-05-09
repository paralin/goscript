// Generated file based on wip.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let x: $.Box<number> = $.box(10)

	// p1 is boxed as p2 takes its address
	let p1: $.Box<$.Box<number> | null> = $.box(x)
	// p2 is boxed as p3 takes its address
	let p2: $.Box<$.Box<$.Box<number> | null> | null> = $.box(p1)
	// p3 is not boxed as nothing takes its address
	let p3: $.Box<$.Box<$.Box<number> | null> | null> | null = p2

	;console.log("**p3 ==", p3!.value!.value!.value)

	// q1 is not boxed as nothing takes its address
	let q1: $.Box<number> | null = x
	;console.log("*q1 ==", q1!.value) // Should translate to q1!.value
}

