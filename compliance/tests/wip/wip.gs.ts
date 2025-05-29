// Generated file based on wip.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Create a simple integer
	let x = $.varRef(10)

	// p1 will be varrefed because its address is taken later
	let p1 = $.varRef(x)

	// p2 is not varrefed as nothing takes its address
	let p2 = x

	// Take the address of p1 to make it varrefed
	let pp1 = p1

	// Compare the pointers - they should be different pointers
	// but point to the same value
	console.log("p1==p2:", (p1!.value === p2!.value))
	console.log("*p1==*p2:", p1!.value!.value == p2!.value)
	console.log("pp1 deref:", pp1!.value!.value)
}

