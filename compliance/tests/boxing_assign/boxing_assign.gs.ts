// Generated file based on boxing_assign.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	// x is boxed as p1 takes the address
	let x: $.VarRef<number> = $.varRef(10)

	// p1 is boxed as p2 takes the address
	let p1: $.VarRef<$.VarRef<number> | null> = $.varRef(x)
	// p2 is boxed as p3 takes the address
	let p2: $.VarRef<$.VarRef<$.VarRef<number> | null> | null> = $.varRef(p1)
	// p3 is not boxed as nothing takes its address
	let p3: $.VarRef<$.VarRef<$.VarRef<number> | null> | null> | null = p2
	/* _ = */ p3!.value

	// should be: let y: $.Box<number> = $.box(15)
	// y is boxed as p1 takes the address
	let y: $.VarRef<number> = $.varRef(15)
	// should be: p1.value = y
	p1!.value = y

	console.log("***p3 ==", p3!.value!.value!!)
}

