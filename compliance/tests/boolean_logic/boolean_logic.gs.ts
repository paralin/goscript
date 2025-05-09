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
	$.println("AND: Expected: false, Actual:", and)
	$.println("OR: Expected: true, Actual:", or)
	$.println("NOT: Expected: false, Actual:", notA)
}

