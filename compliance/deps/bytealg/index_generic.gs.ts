import * as $ from "@goscript/builtin/builtin.js";

export let MaxBruteForce: number = 0

// Index returns the index of the first instance of b in a, or -1 if b is not present in a.
// Requires 2 <= len(b) <= MaxLen.
export function Index(a: Uint8Array, b: Uint8Array): number {
	$.panic("unimplemented")
}

// IndexString returns the index of the first instance of b in a, or -1 if b is not present in a.
// Requires 2 <= len(b) <= MaxLen.
export function IndexString(a: string, b: string): number {
	$.panic("unimplemented")
}

// Cutover reports the number of failures of IndexByte we should tolerate
// before switching over to Index.
// n is the number of bytes processed so far.
// See the bytes.Index implementation for details.
export function Cutover(n: number): number {
	$.panic("unimplemented")
}

