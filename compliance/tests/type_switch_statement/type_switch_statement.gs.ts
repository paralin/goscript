// Generated file based on type_switch_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	let i: null | any = "hello"
	{
		const subject_val = i
		let ts_typeassert_value: any
		let ts_typeassert_ok: boolean

		({value: ts_typeassert_value, ok: ts_typeassert_ok} = $.typeAssert<number>(subject_val, {kind: $.TypeKind.Basic, name: 'number'}));
		if (ts_typeassert_ok) {
			const v = ts_typeassert_value
			console.log("int", v)
		} else ({value: ts_typeassert_value, ok: ts_typeassert_ok} = $.typeAssert<string>(subject_val, {kind: $.TypeKind.Basic, name: 'string'}));
		if (ts_typeassert_ok) {
			const v = ts_typeassert_value
			console.log("string", v)
		} else {
			console.log("unknown")
		}
	}

	let x: null | any = 123
	{
		const subject_val = x
		let ts_typeassert_value: any
		let ts_typeassert_ok: boolean

		({value: ts_typeassert_value, ok: ts_typeassert_ok} = $.typeAssert<boolean>(subject_val, {kind: $.TypeKind.Basic, name: 'boolean'}));
		if (ts_typeassert_ok) {
			console.log("bool")
		} else ({value: ts_typeassert_value, ok: ts_typeassert_ok} = $.typeAssert<number>(subject_val, {kind: $.TypeKind.Basic, name: 'number'}));
		if (ts_typeassert_ok) {
			console.log("int")
		}
	}
}

