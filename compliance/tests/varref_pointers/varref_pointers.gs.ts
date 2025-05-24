// Generated file based on varref_pointers.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	// x is varrefed as p1 takes the address
	let x: $.VarRef<number> = $.varRef(10)
	// p1 is varrefed as p2 takes the address
	let p1: $.VarRef<$.VarRef<number> | null> = $.varRef(x)
	// p2 is varrefed as p3 takes the address
	let p2: $.VarRef<$.VarRef<$.VarRef<number> | null> | null> = $.varRef(p1)
	// p3 is not varrefed as nothing takes its address
	let p3: $.VarRef<$.VarRef<$.VarRef<number> | null> | null> | null = p2

	console.log("***p3 before ==", p3!.value!.value!.value)

	// Dereference multiple times, this should be:
	// Goal: p3!.value!.value!.value = 12
	// Current: p3!.value = 12
	// Issue: only the bottom-most level of the WriteStarExpr checks p3 for varRefing generating .value
	// How do we know that *p3 needs .value?
	p3!.value!.value!.value = 12
	console.log("***p3 after ==", p3!.value!.value!.value)
}

