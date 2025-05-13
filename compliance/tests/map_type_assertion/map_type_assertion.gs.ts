// Generated file based on map_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let i: null | any = null
	i = new Map([["age", 30]])

	let _typeAssertResult_0 = $.typeAssert<Map<string, number>>(i, {kind: $.TypeKind.Map, keyType: 'string', elemType: 'number'})
	let m = _typeAssertResult_0.value
let ok_0 = _typeAssertResult_0.ok
if (ok_0) {
		console.log("Age:", $.mapGet(m, "age", 0))
	} else {
		console.log("Type assertion failed")
	}

	let _typeAssertResult_1 = $.typeAssert<Map<string, string>>(i, {kind: $.TypeKind.Map, keyType: 'string', elemType: 'string'})
	let ok2_1 = _typeAssertResult_1.ok

	// This block should not be reached if the assertion fails as expected.
	// Depending on how Go handles failed assertions with incorrect types,
	// accessing n["key"] might panic if n is nil.
	// For safety and clarity, we'll just print a generic message if it passes unexpectedly.
	if (ok2_1) {
		// This block should not be reached if the assertion fails as expected.
		// Depending on how Go handles failed assertions with incorrect types,
		// accessing n["key"] might panic if n is nil.
		// For safety and clarity, we'll just print a generic message if it passes unexpectedly.
		console.log("Unexpected success for map[string]string assertion")
	} else {
		console.log("Second type assertion (map[string]string) failed as expected")
	}

	let _typeAssertResult_2 = $.typeAssert<Map<number, number>>(i, {kind: $.TypeKind.Map, keyType: 'number', elemType: 'number'})
	let ok3_2 = _typeAssertResult_2.ok

	// Similar to the above, this block should not be reached.
	if (ok3_2) {
		// Similar to the above, this block should not be reached.
		console.log("Unexpected success for map[int]int assertion")
	} else {
		console.log("Third type assertion (map[int]int) failed as expected")
	}
}

