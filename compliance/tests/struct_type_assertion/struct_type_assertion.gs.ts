// Generated file based on struct_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let i: null | any = null
	i = {Name: "Alice"}

	let _typeAssertResult_0 = $.typeAssert<{ Name?: string }>(i, {kind: $.TypeKind.Struct, fields: {'Name': {kind: $.TypeKind.Basic, name: 'string'}}, methods: new Set()})
	let s = _typeAssertResult_0.value
let ok_0 = _typeAssertResult_0.ok
if (ok_0) {
		console.log("Name:", s.Name)
	} else {
		console.log("Type assertion failed")
	}

	let _typeAssertResult_1 = $.typeAssert<{ Age?: number }>(i, {kind: $.TypeKind.Struct, fields: {'Age': {kind: $.TypeKind.Basic, name: 'number'}}, methods: new Set()})
	let j = _typeAssertResult_1.value
let ok2_1 = _typeAssertResult_1.ok
if (ok2_1) {
		console.log("Age:", j.Age)
	} else {
		console.log("Second type assertion failed as expected")
	}
}

