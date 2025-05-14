// Generated file based on chan_type_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let ch1 = $.makeChannel<number>(0, 0, 'both')
	let ch2 = $.makeChannel<string>(0, "", 'send')
	let ch3 = $.makeChannel<number>(0, 0, 'receive')
	let ch4 = $.makeChannel<{  }>(0, {}, 'both')

	let i: null | any = ch1
	{let { ok: ok } = $.typeAssert<$.Channel<number>>(ch1, {kind: $.TypeKind.Channel, elemType: 'number', direction: 'both'})
		if (ok) {
			console.log("i is chan int: ok")
		} else {
			console.log("i is chan int: failed")
		}
	}
	let s: null | any = ch2
	{let { ok: ok } = $.typeAssert<$.Channel<string>>(ch2, {kind: $.TypeKind.Channel, elemType: 'string', direction: 'send'})
		if (ok) {
			console.log("s is chan<- string: ok")
		} else {
			console.log("s is chan<- string: failed")
		}
	}
	let r: null | any = ch3
	{let { ok: ok } = $.typeAssert<$.Channel<number>>(ch3, {kind: $.TypeKind.Channel, elemType: 'number', direction: 'receive'})
		if (ok) {
			console.log("r is <-chan float64: ok")
		} else {
			console.log("r is <-chan float64: failed")
		}
	}
	let e: null | any = ch4
	{let { ok: ok } = $.typeAssert<$.Channel<{  }>>(ch4, {kind: $.TypeKind.Channel, elemType: {kind: $.TypeKind.Struct, fields: {}, methods: new Set()}, direction: 'both'})
		if (ok) {
			console.log("e is chan struct{}: ok")
		} else {
			console.log("e is chan struct{}: failed")
		}
	}
	{let { ok: ok } = $.typeAssert<$.Channel<string>>(ch1, {kind: $.TypeKind.Channel, elemType: 'string', direction: 'both'})
		if (ok) {
			console.log("i is chan string: incorrect")
		} else {
			console.log("i is chan string: correctly failed")
		}
	}
	{let { ok: ok } = $.typeAssert<$.Channel<number>>(ch1, {kind: $.TypeKind.Channel, elemType: 'number', direction: 'send'})
		if (ok) {
			console.log("i is chan<- int: incorrect")
		} else {
			console.log("i is chan<- int: correctly failed")
		}
	}
	{let { ok: ok } = $.typeAssert<$.Channel<number>>(ch1, {kind: $.TypeKind.Channel, elemType: 'number', direction: 'receive'})
		if (ok) {
			console.log("i is <-chan int: incorrect")
		} else {
			console.log("i is <-chan int: correctly failed")
		}
	}
	{let { ok: ok } = $.typeAssert<$.Channel<number>>(ch1, {kind: $.TypeKind.Channel, elemType: 'number', direction: 'send'})
		if (ok) {
			console.log("bidirectional can be used as send-only: ok")
		} else {
			console.log("bidirectional can be used as send-only: failed")
		}
	}
	{let { ok: ok } = $.typeAssert<$.Channel<number>>(ch1, {kind: $.TypeKind.Channel, elemType: 'number', direction: 'receive'})
		if (ok) {
			console.log("bidirectional can be used as receive-only: ok")
		} else {
			console.log("bidirectional can be used as receive-only: failed")
		}
	}}

