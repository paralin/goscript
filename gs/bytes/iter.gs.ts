import * as $ from "@goscript/builtin/index.js";
import { Index, IndexByte, asciiSpace } from "./bytes.gs.js";

import * as iter from "@goscript/iter/index.js"

import * as unicode from "@goscript/unicode/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

// Lines returns an iterator over the newline-terminated lines in the byte slice s.
// The lines yielded by the iterator include their terminating newlines.
// If s is empty, the iterator yields no lines at all.
// If s does not end in a newline, the final yielded line will not end in a newline.
// It returns a single-use iterator.
export function Lines(s: $.Bytes): iter.Seq<$.Bytes> {
	return (_yield: ((p0: $.Bytes) => boolean) | null): void => {
		for (; $.len(s) > 0; ) {
			let line: $.Bytes = new Uint8Array(0)
			{
				let i = IndexByte(s, 10)
				if (i >= 0) {
					[line, s] = [$.goSlice(s, undefined, i + 1), $.goSlice(s, i + 1, undefined)]
				} else {
					[line, s] = [s, null]
				}
			}
			if (!_yield!($.goSlice(line, undefined, $.len(line), $.len(line)))) {
				return 
			}
		}
		return 
	}
}

// explodeSeq returns an iterator over the runes in s.
export function explodeSeq(s: $.Bytes): iter.Seq<$.Bytes> {
	return (_yield: ((p0: $.Bytes) => boolean) | null): void => {
		for (; $.len(s) > 0; ) {
			let [, size] = utf8.DecodeRune(s)
			if (!_yield!($.goSlice(s, undefined, size, size))) {
				return 
			}
			s = $.goSlice(s, size, undefined)
		}
	}
}

// splitSeq is SplitSeq or SplitAfterSeq, configured by how many
// bytes of sep to include in the results (none or all).
export function splitSeq(s: $.Bytes, sep: $.Bytes, sepSave: number): iter.Seq<$.Bytes> {
	if ($.len(sep) == 0) {
		return explodeSeq(s)
	}
	return (_yield: ((p0: $.Bytes) => boolean) | null): void => {
		for (; ; ) {
			let i = Index(s, sep)
			if (i < 0) {
				break
			}
			let frag = $.goSlice(s, undefined, i + sepSave)
			if (!_yield!($.goSlice(frag, undefined, $.len(frag), $.len(frag)))) {
				return 
			}
			s = $.goSlice(s, i + $.len(sep), undefined)
		}
		_yield!($.goSlice(s, undefined, $.len(s), $.len(s)))
	}
}

// SplitSeq returns an iterator over all subslices of s separated by sep.
// The iterator yields the same subslices that would be returned by [Split](s, sep),
// but without constructing a new slice containing the subslices.
// It returns a single-use iterator.
export function SplitSeq(s: $.Bytes, sep: $.Bytes): iter.Seq<$.Bytes> {
	return splitSeq(s, sep, 0)
}

// SplitAfterSeq returns an iterator over subslices of s split after each instance of sep.
// The iterator yields the same subslices that would be returned by [SplitAfter](s, sep),
// but without constructing a new slice containing the subslices.
// It returns a single-use iterator.
export function SplitAfterSeq(s: $.Bytes, sep: $.Bytes): iter.Seq<$.Bytes> {
	return splitSeq(s, sep, $.len(sep))
}

// FieldsSeq returns an iterator over subslices of s split around runs of
// whitespace characters, as defined by [unicode.IsSpace].
// The iterator yields the same subslices that would be returned by [Fields](s),
// but without constructing a new slice containing the subslices.
export function FieldsSeq(s: $.Bytes): iter.Seq<$.Bytes> {
	return (_yield: ((p0: $.Bytes) => boolean) | null): void => {
		let start = -1
		for (let i = 0; i < $.len(s); ) {
			let size = 1
			let r = (s![i] as number)
			let isSpace = asciiSpace![s![i]] != 0
			if (r >= utf8.RuneSelf) {
				;[r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
				isSpace = unicode.IsSpace(r)
			}
			if (isSpace) {
				if (start >= 0) {
					if (!_yield!($.goSlice(s, start, i, i))) {
						return 
					}
					start = -1
				}
			} else if (start < 0) {
				start = i
			}
			i += size
		}
		if (start >= 0) {
			_yield!($.goSlice(s, start, $.len(s), $.len(s)))
		}
	}
}

// FieldsFuncSeq returns an iterator over subslices of s split around runs of
// Unicode code points satisfying f(c).
// The iterator yields the same subslices that would be returned by [FieldsFunc](s),
// but without constructing a new slice containing the subslices.
export function FieldsFuncSeq(s: $.Bytes, f: ((p0: number) => boolean) | null): iter.Seq<$.Bytes> {
	return (_yield: ((p0: $.Bytes) => boolean) | null): void => {
		let start = -1
		for (let i = 0; i < $.len(s); ) {
			let size = 1
			let r = (s![i] as number)
			if (r >= utf8.RuneSelf) {
				;[r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
			}
			if (f!(r)) {
				if (start >= 0) {
					if (!_yield!($.goSlice(s, start, i, i))) {
						return 
					}
					start = -1
				}
			} else if (start < 0) {
				start = i
			}
			i += size
		}
		if (start >= 0) {
			_yield!($.goSlice(s, start, $.len(s), $.len(s)))
		}
	}
}

