// Generated file based on struct_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let i: null | any = null
	i = {Name: "Alice", Number: 8005553424}

	let { value: s, ok: ok } = $.typeAssert<{ Name?: string; Number?: number }>(i, {kind: $.TypeKind.Struct, fields: {'Name': {kind: $.TypeKind.Basic, name: 'string'}, 'Number': {kind: $.TypeKind.Basic, name: 'number'}}, methods: new Set()})
	if (ok) {
		console.log("Name:", s.Name, "Number:", s.Number)
	} else {
		console.log("Type assertion failed")
	}

	let { value: j, ok: ok2 } = $.typeAssert<{ Age?: number }>(i, {kind: $.TypeKind.Struct, fields: {'Age': {kind: $.TypeKind.Basic, name: 'number'}}, methods: new Set()})
	if (ok2) {
		console.log("Age:", j.Age)
	} else {
		console.log("Second type assertion failed as expected")
	}
}

