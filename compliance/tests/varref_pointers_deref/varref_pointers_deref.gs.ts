// Generated file based on varref_pointers_deref.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Create a value
	let x = $.varRef(10)

	// Create two pointers to the same value
	let p1 = x
	let p2 = x

	// These should be different pointers but point to the same value
	console.log("p1==p2:", (p1!.value === p2!.value)) // Should be false in our hardcoded case
	console.log("*p1==*p2:", p1!.value == p2!.value) // Should be true

	// Now create a third pointer that's a copy of p1
	let p3 = p1!.value

	// These should be the same pointer
	console.log("p1==p3:", (p1!.value === p3)) // Should be true, but our solution would return false if p3 is varrefed differently

	// Now, let's create a scenario where one pointer is varrefed by taking its address
	// but we compare it to itself through a different path
	let ptr = $.varRef(x)
	let pp1 = $.varRef(ptr) // pp1 is varrefed because we take its address

	// Save pp1 in another variable but don't take its address
	// so the original ptr is varrefed but its copy is not
	let savedPP1 = pp1!.value

	// Take the address of pp1 to make it varrefed
	let ppp1 = pp1

	// Use ppp1 to make sure it's not considered unused
	console.log("Value through ppp1:", ppp1!.value!.value!.value)

	// This is a comparison of the same pointer through different paths
	// but one path involves a varrefed variable and one doesn't
	console.log("pp1==savedPP1:", (pp1!.value === savedPP1)) // Should be true, but might be false with our current solution

	// Print dereferenced values to verify they're the same
	console.log("**pp1:", pp1!.value!.value!.value)
	console.log("**savedPP1:", savedPP1!.value!.value)
}

