import * as $ from "@goscript/builtin/builtin.js";

import * as bytealg from "@goscript/internal/bytealg/index.js"

import * as unsafe from "@goscript/unsafe/index.js"

export function HasPrefix(s: string, prefix: string): boolean {
	return $.len(s) >= $.len(prefix) && $.sliceString(s, undefined, $.len(prefix)) == prefix
}

export function HasSuffix(s: string, suffix: string): boolean {
	return $.len(s) >= $.len(suffix) && $.sliceString(s, $.len(s) - $.len(suffix), undefined) == suffix
}

export function IndexByte(s: string, c: number): number {
	return bytealg.IndexByteString(s, c)
}

export function Index(s: string, substr: string): number {
	let n = $.len(substr)

	// Use brute force when s and substr both are small

	// IndexByte is faster than bytealg.IndexString, so use it as long as
	// we're not getting lots of false positives.

	// Switch to bytealg.IndexString when IndexByte produces too many false positives.
	switch (true) {
		case n == 0:
			return 0
			break
		case n == 1:
			return IndexByte(s, $.indexString(substr, 0))
			break
		case n == $.len(s):
			if (substr == s) {
				return 0
			}
			return -1
			break
		case n > $.len(s):
			return -1
			break
		case n <= bytealg.MaxLen:
			if ($.len(s) <= bytealg.MaxBruteForce) {
				return bytealg.IndexString(s, substr)
			}
			let c0 = $.indexString(substr, 0)
			let c1 = $.indexString(substr, 1)
			let i = 0
			let t = $.len(s) - n + 1
			let fails = 0
			for (; i < t; ) {

				// IndexByte is faster than bytealg.IndexString, so use it as long as
				// we're not getting lots of false positives.
				if ($.indexString(s, i) != c0) {
					// IndexByte is faster than bytealg.IndexString, so use it as long as
					// we're not getting lots of false positives.
					let o = IndexByte($.sliceString(s, i + 1, t), c0)
					if (o < 0) {
						return -1
					}
					i += o + 1
				}
				if ($.indexString(s, i + 1) == c1 && $.sliceString(s, i, i + n) == substr) {
					return i
				}
				fails++
				i++
				// Switch to bytealg.IndexString when IndexByte produces too many false positives.
				if (fails > bytealg.Cutover(i)) {
					let r = bytealg.IndexString($.sliceString(s, i, undefined), substr)
					if (r >= 0) {
						return r + i
					}
					return -1
				}
			}
			return -1
			break
	}
	let c0 = $.indexString(substr, 0)
	let c1 = $.indexString(substr, 1)
	let i = 0
	let t = $.len(s) - n + 1
	let fails = 0

	// See comment in ../bytes/bytes.go.
	for (; i < t; ) {
		if ($.indexString(s, i) != c0) {
			let o = IndexByte($.sliceString(s, i + 1, t), c0)
			if (o < 0) {
				return -1
			}
			i += o + 1
		}
		if ($.indexString(s, i + 1) == c1 && $.sliceString(s, i, i + n) == substr) {
			return i
		}
		i++
		fails++

		// See comment in ../bytes/bytes.go.
		if (fails >= 4 + (i >> 4) && i < t) {
			// See comment in ../bytes/bytes.go.
			let j = bytealg.IndexRabinKarp($.sliceString(s, i, undefined), substr)
			if (j < 0) {
				return -1
			}
			return i + j
		}
	}
	return -1
}

export function Cut(s: string, sep: string): [string, boolean] {
	let before: string = ""
	let after: string = ""
	let found: boolean = false
	{
		{
			let i = Index(s, sep)
			if (i >= 0) {
				return [$.sliceString(s, undefined, i), $.sliceString(s, i + $.len(sep), undefined), true]
			}
		}
		return [s, "", false]
	}
}

export function CutPrefix(s: string, prefix: string): [string, boolean] {
	let after: string = ""
	let found: boolean = false
	{
		if (!HasPrefix(s, prefix)) {
			return [s, false]
		}
		return [$.sliceString(s, $.len(prefix), undefined), true]
	}
}

export function CutSuffix(s: string, suffix: string): [string, boolean] {
	let before: string = ""
	let found: boolean = false
	{
		if (!HasSuffix(s, suffix)) {
			return [s, false]
		}
		return [$.sliceString(s, undefined, $.len(s) - $.len(suffix)), true]
	}
}

export function TrimPrefix(s: string, prefix: string): string {
	if (HasPrefix(s, prefix)) {
		return $.sliceString(s, $.len(prefix), undefined)
	}
	return s
}

export function TrimSuffix(s: string, suffix: string): string {
	if (HasSuffix(s, suffix)) {
		return $.sliceString(s, undefined, $.len(s) - $.len(suffix))
	}
	return s
}

export function Clone(s: string): string {
	if ($.len(s) == 0) {
		return ""
	}
	let b = new Uint8Array($.len(s))
	copy(b, s)
	return unsafe.String(b![0], $.len(b))
}

