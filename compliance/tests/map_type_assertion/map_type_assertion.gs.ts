// Generated file based on map_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	let i: null | any = null
	i = new Map([["age", 30]])

	let { value: m, ok: ok } = $.typeAssert<Map<string, number> | null>(i, {kind: $.TypeKind.Map, keyType: {kind: $.TypeKind.Basic, name: 'string'}, elemType: {kind: $.TypeKind.Basic, name: 'number'}})
	if (ok) {
		console.log("Age:", $.mapGet(m, "age", 0)[0])
	} else {
		console.log("Type assertion failed")
	}

	let { ok: ok2 } = $.typeAssert<Map<string, string> | null>(i, {kind: $.TypeKind.Map, keyType: {kind: $.TypeKind.Basic, name: 'string'}, elemType: {kind: $.TypeKind.Basic, name: 'string'}})

	// This block should not be reached if the assertion fails as expected.
	// Depending on how Go handles failed assertions with incorrect types,
	// accessing n["key"] might panic if n is nil.
	// For safety and clarity, we'll just print a generic message if it passes unexpectedly.
	if (ok2) {
		// This block should not be reached if the assertion fails as expected.
		// Depending on how Go handles failed assertions with incorrect types,
		// accessing n["key"] might panic if n is nil.
		// For safety and clarity, we'll just print a generic message if it passes unexpectedly.
		console.log("Unexpected success for map[string]string assertion")
	} else {
		console.log("Second type assertion (map[string]string) failed as expected")
	}

	let { ok: ok3 } = $.typeAssert<Map<number, number> | null>(i, {kind: $.TypeKind.Map, keyType: {kind: $.TypeKind.Basic, name: 'number'}, elemType: {kind: $.TypeKind.Basic, name: 'number'}})

	// Similar to the above, this block should not be reached.
	if (ok3) {
		// Similar to the above, this block should not be reached.
		console.log("Unexpected success for map[int]int assertion")
	} else {
		console.log("Third type assertion (map[int]int) failed as expected")
	}
}

