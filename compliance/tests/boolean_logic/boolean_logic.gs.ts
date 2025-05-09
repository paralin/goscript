// Generated file based on boolean_logic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	// === Boolean Logic ===
	let a = true
	let b = false
	let and = a && b
	let or = a || b
	let notA = !a
	console.log("AND: Expected: false, Actual:", and);
	console.log("OR: Expected: true, Actual:", or);
	console.log("NOT: Expected: false, Actual:", notA);
}

