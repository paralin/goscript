// Generated file based on boxing.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	console.log("setting x to 10")
	// x is boxed as p1 takes the address
	let x: $.Box<number> = $.box(10)

	// p1 is boxed as p2 takes the address
	let p1: $.Box<$.Box<number> | null> = $.box(x)
	// p2 is boxed as p3 takes the address
	let p2: $.Box<$.Box<$.Box<number> | null> | null> = $.box(p1)
	// p3 is not boxed as nothing takes its address
	let p3: $.Box<$.Box<$.Box<number> | null> | null> | null = p2

	console.log("***p3 ==", p3!.value!.value!.value)
	console.log()

	console.log("setting ***p3 to 12")
	p3!.value!.value!.value = 12
	console.log("***p3 ==", p3!.value!.value!.value)
	console.log()

	console.log("setting y to 15, p1 to &y")
	// should be: let y: $.Box<number> = $.box(15)
	// y is boxed as p1 takes the address
	let y: $.Box<number> = $.box(15)
	// should be: p1.value = y
	p1!.value = y

	console.log("***p3 ==", p3!.value!.value!.value)
	console.log()
}

