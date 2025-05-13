// Generated file based on map_nested.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let nestedMap = $.makeMap<string, Map<string, number>>()

	$.mapSet(nestedMap, "user1", $.makeMap<string, number>())
	$.mapSet(nestedMap, "user2", $.makeMap<string, number>())

	$.mapSet(nestedMap.get("user1") ?? null, "score", 95)
	$.mapSet(nestedMap.get("user1") ?? null, "age", 30)
	$.mapSet(nestedMap.get("user2") ?? null, "score", 85)
	$.mapSet(nestedMap.get("user2") ?? null, "age", 25)

	console.log("User1 score:", nestedMap.get("user1") ?? null.get("score") ?? 0)
	console.log("User2 age:", nestedMap.get("user2") ?? null.get("age") ?? 0)

	let i: null | any = null
	i = nestedMap

	let { value: m, ok: ok } = $.typeAssert<Map<string, Map<string, number>>>(i, {kind: $.TypeKind.Map, keyType: 'string', elemType: {kind: $.TypeKind.Map, keyType: 'string', elemType: 'number'}})
	if (ok) {
		console.log("Nested map type assertion passed:", m.get("user1") ?? null.get("score") ?? 0)
	} else {
		console.log("FAIL: Nested map type assertion failed")
	}

	let { ok: ok2 } = $.typeAssert<Map<string, Map<number, number>>>(i, {kind: $.TypeKind.Map, keyType: 'string', elemType: {kind: $.TypeKind.Map, keyType: 'number', elemType: 'number'}})
	if (ok2) {
		console.log("FAIL: Incorrect inner key type assertion unexpectedly passed")
	} else {
		console.log("Incorrect inner key type assertion correctly failed")
	}

	let { ok: ok3 } = $.typeAssert<Map<string, Map<string, string>>>(i, {kind: $.TypeKind.Map, keyType: 'string', elemType: {kind: $.TypeKind.Map, keyType: 'string', elemType: 'string'}})
	if (ok3) {
		console.log("FAIL: Incorrect inner value type assertion unexpectedly passed")
	} else {
		console.log("Incorrect inner value type assertion correctly failed")
	}
}

