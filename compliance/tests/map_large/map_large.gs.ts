// Generated file based on map_large.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let largeMap = $.makeMap<string, number>()

	$.mapSet(largeMap, "item1", 1)
	$.mapSet(largeMap, "item2", 2)
	$.mapSet(largeMap, "item3", 3)
	$.mapSet(largeMap, "item4", 4)
	$.mapSet(largeMap, "item5", 5)
	$.mapSet(largeMap, "item6", 6)
	$.mapSet(largeMap, "item7", 7)
	$.mapSet(largeMap, "item8", 8)

	console.log("Large map size:", $.len(largeMap))

	let i: null | any = null
	i = largeMap

	let { value: m, ok: ok } = $.typeAssert<Map<string, number>>(i, {kind: $.TypeKind.Map, keyType: 'string', elemType: 'number'})
	if (ok) {
		console.log("Large map type assertion passed")
		console.log("item7 value:", m.get("item7") ?? 0)
	} else {
		console.log("FAIL: Large map type assertion failed")
	}

	let { ok: ok2 } = $.typeAssert<Map<string, string>>(i, {kind: $.TypeKind.Map, keyType: 'string', elemType: 'string'})
	if (ok2) {
		console.log("FAIL: Incorrect value type assertion unexpectedly passed")
	} else {
		console.log("Incorrect value type assertion correctly failed")
	}
}

