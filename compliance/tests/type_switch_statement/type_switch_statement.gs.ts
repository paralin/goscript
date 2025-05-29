// Generated file based on type_switch_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Basic type switch with variable and default case
	let i: null | any = "hello"
	$.typeSwitch(i, [{ types: [{kind: $.TypeKind.Basic, name: 'number'}], body: (v) => {
		console.log("int", v)
	}},
	{ types: [{kind: $.TypeKind.Basic, name: 'string'}], body: (v) => {
		console.log("string", v)
	}}], () => {
		console.log("unknown")
	})

	// Type switch without variable
	let x: null | any = 123
	$.typeSwitch(x, [{ types: [{kind: $.TypeKind.Basic, name: 'boolean'}], body: () => {
		console.log("bool")
	}},
	{ types: [{kind: $.TypeKind.Basic, name: 'number'}], body: () => {
		console.log("int")
	}}])

	// Type switch with multiple types in a case
	let y: null | any = true
	$.typeSwitch(y, [{ types: [{kind: $.TypeKind.Basic, name: 'number'}, {kind: $.TypeKind.Basic, name: 'number'}], body: (v) => {
		console.log("number", v)
	}},
	{ types: [{kind: $.TypeKind.Basic, name: 'string'}, {kind: $.TypeKind.Basic, name: 'boolean'}], body: (v) => {
		console.log("string or bool", v)
	}}])

	// Type switch with initialization statement
	{
		let z = getInterface()
		$.typeSwitch(z, [{ types: [{kind: $.TypeKind.Basic, name: 'number'}], body: (v) => {
			console.log("z is int", v)
		}}])
	}

	// Default-only type switch
	let w: null | any = "test"
	$.typeSwitch(w, [], () => {
		console.log("default only")
	})
	$.typeSwitch(w, [], () => {
		console.log("default only, value is", $.mustTypeAssert<string>(w, {kind: $.TypeKind.Basic, name: 'string'}))
	})
}

export function getInterface(): null | any {
	return 42
}

