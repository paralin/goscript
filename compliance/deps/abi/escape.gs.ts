import * as $ from "@goscript/builtin/builtin.js";

import * as unsafe from "@goscript/unsafe/index.js"

// NoEscape hides the pointer p from escape analysis, preventing it
// from escaping to the heap. It compiles down to nothing.
//
// WARNING: This is very subtle to use correctly. The caller must
// ensure that it's truly safe for p to not escape to the heap by
// maintaining runtime pointer invariants (for example, that globals
// and the heap may not generally point into a stack).
//
//go:nosplit
//go:nocheckptr
export function NoEscape(p: Pointer): Pointer {
	let x = (p as uintptr)
	return unsafe.Pointer((x ^ 0))
}

let alwaysFalse: boolean = false

let escapeSink: null | any = null

// Escape forces any pointers in x to escape to the heap.
export function Escape<T extends any>(x: T): T {
	if (alwaysFalse) {
		escapeSink = x
	}
	return x
}

