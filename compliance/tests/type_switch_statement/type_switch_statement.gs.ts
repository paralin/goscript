// Generated file based on type_switch_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	// Basic type switch with variable and default case
	let i: null | any = "hello"
	{
		const subject = i
		if ($.typeAssert<number>(subject, {kind: $.TypeKind.Basic, name: 'number'}).ok) {
			const v = $.typeAssert<number>(subject, {kind: $.TypeKind.Basic, name: 'number'}).value

			console.log("int", v)
		} else if ($.typeAssert<string>(subject, {kind: $.TypeKind.Basic, name: 'string'}).ok) {
			const v = $.typeAssert<string>(subject, {kind: $.TypeKind.Basic, name: 'string'}).value

			console.log("string", v)
		} else {
			console.log("unknown")
		}
	}

	// Type switch without variable
	let x: null | any = 123
	{
		const subject = x
		if ($.typeAssert<boolean>(subject, {kind: $.TypeKind.Basic, name: 'boolean'}).ok) {
			console.log("bool")
		} else if ($.typeAssert<number>(subject, {kind: $.TypeKind.Basic, name: 'number'}).ok) {
			console.log("int")
		}
	}

	// Type switch with multiple types in a case
	let y: null | any = true
	{
		const subject = y
		if ($.is(subject, {kind: $.TypeKind.Basic, name: 'number'}) || $.is(subject, {kind: $.TypeKind.Basic, name: 'number'})) {
			const v = subject

			console.log("number", v)
		} else if ($.is(subject, {kind: $.TypeKind.Basic, name: 'string'}) || $.is(subject, {kind: $.TypeKind.Basic, name: 'boolean'})) {
			const v = subject

			console.log("string or bool", v)
		}
	}

	// Type switch with initialization statement
	{
		let z = getInterface()
		if (true) {
			{
				const subject = z
				if ($.typeAssert<number>(subject, {kind: $.TypeKind.Basic, name: 'number'}).ok) {
					const v = $.typeAssert<number>(subject, {kind: $.TypeKind.Basic, name: 'number'}).value

					console.log("z is int", v)
				}
			}
		}
	}

	// Default-only type switch
	let w: null | any = "test"
	{
		const subject = w
		{ // Default only case
			console.log("default only")
		}
	}
}

function getInterface(): null | any {
	return 42
}

