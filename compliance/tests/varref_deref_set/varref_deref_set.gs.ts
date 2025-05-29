// Generated file based on varref_deref_set.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// y is varrefed because p1 takes its address
	let y: $.VarRef<number> = $.varRef(15)

	// p1 is varrefed because p1_varRefer takes its address
	let p1: $.VarRef<$.VarRef<number> | null> = $.varRef(null)
	// Ensure p1 is varrefed
	let p1_varRefer: $.VarRef<$.VarRef<number> | null> | null = p1
	/* _ = */ p1_varRefer!.value

	// Expected TS: p1.value = y
	p1!.value = y

	// Dereferencing p1 (varrefed variable) to access y (varrefed variable)
	// Go: println(*p1)
	// Expected TS for same behavior: console.log(p1.value.value)
	// We access p1 which should be p1.value. Then we dereference that, which should be p1.value.value.
	console.log(p1!.value!.value)

	// Set the value
	p1!.value!.value = 20
}

