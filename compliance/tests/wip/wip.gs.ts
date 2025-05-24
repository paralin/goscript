// Generated file based on wip.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	let x: $.VarRef<number> = $.varRef(10)

	// p1 is varrefed as p2 takes its address
	let p1: $.VarRef<$.VarRef<number> | null> = $.varRef(x)
	// p2 is varrefed as p3 takes its address
	let p2: $.VarRef<$.VarRef<$.VarRef<number> | null> | null> = $.varRef(p1)
	// p3 is not varrefed as nothing takes its address
	let p3: $.VarRef<$.VarRef<$.VarRef<number> | null> | null> | null = p2

	console.log("**p3 ==", p3!.value!.value!!)

	// q1 is not varrefed as nothing takes its address
	let q1: $.VarRef<number> | null = x
	console.log("*q1 ==", q1!.value!.value) // Should translate to q1!.value
}

