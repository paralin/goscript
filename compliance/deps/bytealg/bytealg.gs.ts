import * as $ from "@goscript/builtin/builtin.js";

import * as cpu from "@goscript/internal/cpu/index.js"

import * as unsafe from "@goscript/unsafe/index.js"

let offsetX86HasSSE42: uintptr = unsafe.Offsetof(cpu.X86.HasSSE42)

let offsetX86HasAVX2: uintptr = unsafe.Offsetof(cpu.X86.HasAVX2)

let offsetX86HasPOPCNT: uintptr = unsafe.Offsetof(cpu.X86.HasPOPCNT)

let offsetS390xHasVX: uintptr = unsafe.Offsetof(cpu.S390X.HasVX)

let offsetPPC64HasPOWER9: uintptr = unsafe.Offsetof(cpu.PPC64.IsPOWER9)

export let MaxLen: number = 0

export let PrimeRK: number = 16777619

// HashStr returns the hash and the appropriate multiplicative
// factor for use in Rabin-Karp algorithm.
export function HashStr<T extends string | Uint8Array>(sep: T): [number, number] {
	let hash = (0 as number)
	for (let i = 0; i < $.len(sep); i++) {
		hash = hash * 16777619 + ($.indexStringOrBytes(sep, i) as number)
	}
	let [pow, sq] = [1, 16777619]
	for (let i = $.len(sep); i > 0; i >>= 1) {
		if ((i & 1) != 0) {
			pow *= sq
		}
		sq *= sq
	}
	return [hash, pow]
}

// HashStrRev returns the hash of the reverse of sep and the
// appropriate multiplicative factor for use in Rabin-Karp algorithm.
export function HashStrRev<T extends string | Uint8Array>(sep: T): [number, number] {
	let hash = (0 as number)
	for (let i = $.len(sep) - 1; i >= 0; i--) {
		hash = hash * 16777619 + ($.indexStringOrBytes(sep, i) as number)
	}
	let [pow, sq] = [1, 16777619]
	for (let i = $.len(sep); i > 0; i >>= 1) {
		if ((i & 1) != 0) {
			pow *= sq
		}
		sq *= sq
	}
	return [hash, pow]
}

// IndexRabinKarp uses the Rabin-Karp search algorithm to return the index of the
// first occurrence of sep in s, or -1 if not present.
export function IndexRabinKarp<T extends string | Uint8Array>(s: T, sep: T): number {
	// Rabin-Karp search
	let [hashss, pow] = HashStr(sep)
	let n = $.len(sep)
	let h: number = 0
	for (let i = 0; i < n; i++) {
		h = h * 16777619 + ($.indexStringOrBytes(s, i) as number)
	}
	if (h == hashss && $.genericBytesOrStringToString($.sliceStringOrBytes(s, undefined, n)) == $.genericBytesOrStringToString(sep)) {
		return 0
	}
	for (let i = n; i < $.len(s); ) {
		h *= 16777619
		h += ($.indexStringOrBytes(s, i) as number)
		h -= pow * ($.indexStringOrBytes(s, i - n) as number)
		i++
		if (h == hashss && $.genericBytesOrStringToString($.sliceStringOrBytes(s, i - n, i)) == $.genericBytesOrStringToString(sep)) {
			return i - n
		}
	}
	return -1
}

// LastIndexRabinKarp uses the Rabin-Karp search algorithm to return the last index of the
// occurrence of sep in s, or -1 if not present.
export function LastIndexRabinKarp<T extends string | Uint8Array>(s: T, sep: T): number {
	// Rabin-Karp search from the end of the string
	let [hashss, pow] = HashStrRev(sep)
	let n = $.len(sep)
	let last = $.len(s) - n
	let h: number = 0
	for (let i = $.len(s) - 1; i >= last; i--) {
		h = h * 16777619 + ($.indexStringOrBytes(s, i) as number)
	}
	if (h == hashss && $.genericBytesOrStringToString($.sliceStringOrBytes(s, last, undefined)) == $.genericBytesOrStringToString(sep)) {
		return last
	}
	for (let i = last - 1; i >= 0; i--) {
		h *= 16777619
		h += ($.indexStringOrBytes(s, i) as number)
		h -= pow * ($.indexStringOrBytes(s, i + n) as number)
		if (h == hashss && $.genericBytesOrStringToString($.sliceStringOrBytes(s, i, i + n)) == $.genericBytesOrStringToString(sep)) {
			return i
		}
	}
	return -1
}

// MakeNoZero makes a slice of length n and capacity of at least n Bytes
// without zeroing the bytes (including the bytes between len and cap).
// It is the caller's responsibility to ensure uninitialized bytes
// do not leak to the end user.
export function MakeNoZero(n: number): Uint8Array {}

