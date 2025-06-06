// Generated file based on index_expr_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Test type assertion assignment with indexed LHS using regular assignment
	let slice = $.arrayToSlice<null | any>(["hello", 42, true])
	let results: null | any[] = [null, null]
	let ok: boolean = false
	let _gs_ta_val_9a76: number
	let _gs_ta_ok_9a76: boolean
	({ value: _gs_ta_val_9a76, ok: _gs_ta_ok_9a76 } = $.typeAssert<number>(slice![1], {kind: $.TypeKind.Basic, name: 'number'}))
	results![0] = _gs_ta_val_9a76
	ok = _gs_ta_ok_9a76
	if (ok) {
		console.log("slice[1] as int:", $.mustTypeAssert<number>(results![0], {kind: $.TypeKind.Basic, name: 'number'}))
	}

	// Test type assertion assignment with map indexed LHS using regular assignment
	let m: Map<string, null | any> | null = $.makeMap<string, null | any>()
	$.mapSet(m, "key2", 123)
	let mapResults: Map<string, null | any> | null = $.makeMap<string, null | any>()
	let ok2: boolean = false
	let _gs_ta_val_d2f5: number
	let _gs_ta_ok_d2f5: boolean
	({ value: _gs_ta_val_d2f5, ok: _gs_ta_ok_d2f5 } = $.typeAssert<number>($.mapGet(m, "key2", null)[0], {kind: $.TypeKind.Basic, name: 'number'}))
	$.mapSet(mapResults, "result", _gs_ta_val_d2f5)
	ok2 = _gs_ta_ok_d2f5
	if (ok2) {
		console.log("m[key2] as int:", $.mustTypeAssert<number>($.mapGet(mapResults, "result", null)[0], {kind: $.TypeKind.Basic, name: 'number'}))
	}
}

