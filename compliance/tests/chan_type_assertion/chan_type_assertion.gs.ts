// Generated file based on chan_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let c1: $.Channel<number> = null
	let c2: $.Channel<number> = null
	let c3: $.Channel<number> = null
	let c4: $.Channel<boolean> = null

	let i: null | any = c1
	let { ok: ok1 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok1)

	let { ok: ok2 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok2)

	let { ok: ok3 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok3)

	i = c2
	let { ok: ok5 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok5)
	let { ok: ok6 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok6)
	let { ok: ok7 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok7)

	i = c3
	let { ok: ok8 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok8)
	let { ok: ok9 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok9)
	let { ok: ok10 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok10)

	// Test with nil channel
	let cnil: $.Channel<string> = null
	i = cnil
	let { ok: ok11 } = $.typeAssert<$.Channel<string>>(i, {kind: $.TypeKind.Channel, elemType: 'string'})
	console.log(ok11)
	let { ok: ok12 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok12)

	// Test with a non-channel type
	let s: string = "hello"
	i = s
	let { ok: ok13 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok13)

	i = c4
	let { ok: ok14 } = $.typeAssert<$.Channel<boolean>>(i, {kind: $.TypeKind.Channel, elemType: 'boolean'})
	console.log(ok14)
	let { ok: ok15 } = $.typeAssert<$.Channel<number>>(i, {kind: $.TypeKind.Channel, elemType: 'number'})
	console.log(ok15)
}

