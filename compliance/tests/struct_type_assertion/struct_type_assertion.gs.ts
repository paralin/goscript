// Generated file based on struct_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let i: null | any = null
	i = {Name: "Alice"}

	let { value: s, ok: ok } = $.typeAssert<any/* unhandled type: *types.Struct */>(i, {kind: $.TypeKind.Struct, fields: new Set(['Name'])})
	if (ok) {
		console.log("Name:", s.Name)
	} else {
		console.log("Type assertion failed")
	}

	let { value: j, ok: ok2 } = $.typeAssert<any/* unhandled type: *types.Struct */>(i, {kind: $.TypeKind.Struct, fields: new Set(['Age'])})
	if (ok2) {
		console.log("Age:", j.Age)
	} else {
		console.log("Second type assertion failed as expected")
	}
}

