// Generated file based on map_boolean_keys.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let boolMap = $.makeMap<boolean, string>()

	$.mapSet(boolMap, true, "True value")
	$.mapSet(boolMap, false, "False value")

	console.log("Map size:", $.len(boolMap))

	console.log("Value for true:", boolMap.get(true) ?? "")
	console.log("Value for false:", boolMap.get(false) ?? "")

	let i: null | any = null
	i = boolMap

	let { value: m, ok: ok } = $.typeAssert<Map<boolean, string>>(i, {kind: $.TypeKind.Map, keyType: 'boolean', elemType: 'string'})
	if (ok) {
		console.log("Correct type assertion passed:", m.get(true) ?? "")
	} else {
		console.log("FAIL: Correct type assertion failed")
	}

	let { ok: ok2 } = $.typeAssert<Map<string, string>>(i, {kind: $.TypeKind.Map, keyType: 'string', elemType: 'string'})
	if (ok2) {
		console.log("FAIL: Incorrect key type assertion unexpectedly passed")
	} else {
		console.log("Incorrect key type assertion correctly failed")
	}

	let { ok: ok3 } = $.typeAssert<Map<boolean, number>>(i, {kind: $.TypeKind.Map, keyType: 'boolean', elemType: 'number'})
	if (ok3) {
		console.log("FAIL: Incorrect value type assertion unexpectedly passed")
	} else {
		console.log("Incorrect value type assertion correctly failed")
	}
}

