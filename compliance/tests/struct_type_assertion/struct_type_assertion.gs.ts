// Generated file based on struct_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let i: null | any = null
	i = {Name: "Alice"}

	let _typeAssertResult_0 = $.typeAssert<{ Name?: string }>(i, {kind: $.TypeKind.Struct, fields: {'Name': {kind: $.TypeKind.Basic, name: 'string'}}, methods: new Set()})
	let s = _typeAssertResult_0.value
let ok = _typeAssertResult_0.ok
if (ok) {
		console.log("Name:", s.Name)
	} else {
		console.log("Type assertion failed")
	}

	let _typeAssertResult_1 = $.typeAssert<{ Age?: number }>(i, {kind: $.TypeKind.Struct, fields: {'Age': {kind: $.TypeKind.Basic, name: 'number'}}, methods: new Set()})
	let j = _typeAssertResult_1.value
let ok2 = _typeAssertResult_1.ok
if (ok2) {
		console.log("Age:", j.Age)
	} else {
		console.log("Second type assertion failed as expected")
	}
}

