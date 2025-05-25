import * as $ from "@goscript/builtin/builtin.js";

import * as bytealg from "@goscript/internal/bytealg/index.js"

import * as stringslite from "@goscript/internal/stringslite/index.js"

import * as bits from "@goscript/math/bits/index.js"

import * as unicode from "@goscript/unicode/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

let maxInt: number = ((~(0 as number) >> 1) as number)

// explode splits s into a slice of UTF-8 strings,
// one string per Unicode character up to a maximum of n (n < 0 means no limit).
// Invalid UTF-8 bytes are sliced individually.
export function explode(s: string, n: number): $.Slice<string> {
	let l = utf8.RuneCountInString(s)
	if (n < 0 || n > l) {
		n = l
	}
	let a = $.makeSlice<string>(n)
	for (let i = 0; i < n - 1; i++) {
		let [, size] = utf8.DecodeRuneInString(s)
		a![i] = $.sliceString(s, undefined, size)
		s = $.sliceString(s, size, undefined)
	}
	if (n > 0) {
		a![n - 1] = s
	}
	return a
}

// Count counts the number of non-overlapping instances of substr in s.
// If substr is an empty string, Count returns 1 + the number of Unicode code points in s.
export function Count(s: string, substr: string): number {
	// special case
	if ($.len(substr) == 0) {
		return utf8.RuneCountInString(s) + 1
	}
	if ($.len(substr) == 1) {
		return bytealg.CountString(s, $.indexString(substr, 0))
	}
	let n = 0
	for (; ; ) {
		let i = Index(s, substr)
		if (i == -1) {
			return n
		}
		n++
		s = $.sliceString(s, i + $.len(substr), undefined)
	}
}

// Contains reports whether substr is within s.
export function Contains(s: string, substr: string): boolean {
	return Index(s, substr) >= 0
}

// ContainsAny reports whether any Unicode code points in chars are within s.
export function ContainsAny(s: string, chars: string): boolean {
	return IndexAny(s, chars) >= 0
}

// ContainsRune reports whether the Unicode code point r is within s.
export function ContainsRune(s: string, r: number): boolean {
	return IndexRune(s, r) >= 0
}

// ContainsFunc reports whether any Unicode code points r within s satisfy f(r).
export function ContainsFunc(s: string, f: ((p0: number) => boolean) | null): boolean {
	return IndexFunc(s, f) >= 0
}

// LastIndex returns the index of the last instance of substr in s, or -1 if substr is not present in s.
export function LastIndex(s: string, substr: string): number {
	let n = $.len(substr)
	switch (true) {
		case n == 0:
			return $.len(s)
			break
		case n == 1:
			return bytealg.LastIndexByteString(s, $.indexString(substr, 0))
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
	}
	// Rabin-Karp search from the end of the string
	let [hashss, pow] = bytealg.HashStrRev(substr)
	let last = $.len(s) - n
	let h: number = 0
	for (let i = $.len(s) - 1; i >= last; i--) {
		h = h * bytealg.PrimeRK + ($.indexString(s, i) as number)
	}
	if (h == hashss && $.sliceString(s, last, undefined) == substr) {
		return last
	}
	for (let i = last - 1; i >= 0; i--) {
		h *= bytealg.PrimeRK
		h += ($.indexString(s, i) as number)
		h -= pow * ($.indexString(s, i + n) as number)
		if (h == hashss && $.sliceString(s, i, i + n) == substr) {
			return i
		}
	}
	return -1
}

// IndexByte returns the index of the first instance of c in s, or -1 if c is not present in s.
export function IndexByte(s: string, c: number): number {
	return stringslite.IndexByte(s, c)
}

// IndexRune returns the index of the first instance of the Unicode code point
// r, or -1 if rune is not present in s.
// If r is [utf8.RuneError], it returns the first instance of any
// invalid UTF-8 byte sequence.
export function IndexRune(s: string, r: number): number {
	let haveFastIndex: boolean = bytealg.MaxBruteForce > 0

	// Search for rune r using the last byte of its UTF-8 encoded form.
	// The distribution of the last byte is more uniform compared to the
	// first byte which has a 78% chance of being [240, 243, 244].

	// Step backwards comparing bytes.

	// see comment in ../bytes/bytes.go
	switch (true) {
		case 0 <= r && r < utf8.RuneSelf:
			return IndexByte(s, $.byte(r))
			break
		case r == utf8.RuneError:
			{
				const _runes = $.stringToRunes(s)
				for (let i = 0; i < _runes.length; i++) {
					const r = _runes[i]
					{
						if (r == utf8.RuneError) {
							return i
						}
					}
				}
			}
			return -1
			break
		case !utf8.ValidRune(r):
			return -1
			break
		default:
			let rs = String.fromCharCode(r)
			let last = $.len(rs) - 1
			let i = last
			let fails = 0
			for (; i < $.len(s); ) {
				if ($.indexString(s, i) != $.indexString(rs, last)) {
					let o = IndexByte($.sliceString(s, i + 1, undefined), $.indexString(rs, last))
					if (o < 0) {
						return -1
					}
					i += o + 1
				}
				// Step backwards comparing bytes.
				for (let j = 1; j < $.len(rs); j++) {
					if ($.indexString(s, i - j) != $.indexString(rs, last - j)) {
						// unhandled branch statement token: goto
					}
				}
				return i - last
				next: fails++
				i++
				if ((false && fails > bytealg.Cutover(i)) && i < $.len(s) || (!false && fails >= 4 + (i >> 4) && i < $.len(s))) {
					// unhandled branch statement token: goto
				}
			}
			return -1
			fallback: if (false) {
				{
					let j = bytealg.IndexString($.sliceString(s, i - last, undefined), String.fromCharCode(r))
					if (j >= 0) {
						return i + j - last
					}
				}
			} else {
				let c0 = $.indexString(rs, last)
				let c1 = $.indexString(rs, last - 1)
				loop: for (; i < $.len(s); i++) {
					if ($.indexString(s, i) == c0 && $.indexString(s, i - 1) == c1) {
						for (let k = 2; k < $.len(rs); k++) {
							if ($.indexString(s, i - k) != $.indexString(rs, last - k)) {
								continue
							}
						}
						return i - last
					}
				}
			}
			return -1
			break
	}
}

// IndexAny returns the index of the first instance of any Unicode code point
// from chars in s, or -1 if no Unicode code point from chars is present in s.
export function IndexAny(s: string, chars: string): number {

	// Avoid scanning all of s.
	if (chars == "") {
		// Avoid scanning all of s.
		return -1
	}

	// Avoid scanning all of s.
	if ($.len(chars) == 1) {
		// Avoid scanning all of s.
		let r = ($.indexString(chars, 0) as number)
		if (r >= utf8.RuneSelf) {
			r = utf8.RuneError
		}
		return IndexRune(s, r)
	}
	if ($.len(s) > 8) {
		{
			let [_as, isASCII] = makeASCIISet(chars)
			if (isASCII) {
				for (let i = 0; i < $.len(s); i++) {
					if (_as.contains($.indexString(s, i))) {
						return i
					}
				}
				return -1
			}
		}
	}
	{
		const _runes = $.stringToRunes(s)
		for (let i = 0; i < _runes.length; i++) {
			const c = _runes[i]
			{
				if (IndexRune(chars, c) >= 0) {
					return i
				}
			}
		}
	}
	return -1
}

// LastIndexAny returns the index of the last instance of any Unicode code
// point from chars in s, or -1 if no Unicode code point from chars is
// present in s.
export function LastIndexAny(s: string, chars: string): number {

	// Avoid scanning all of s.
	if (chars == "") {
		// Avoid scanning all of s.
		return -1
	}
	if ($.len(s) == 1) {
		let rc = ($.indexString(s, 0) as number)
		if (rc >= utf8.RuneSelf) {
			rc = utf8.RuneError
		}
		if (IndexRune(chars, rc) >= 0) {
			return 0
		}
		return -1
	}
	if ($.len(s) > 8) {
		{
			let [_as, isASCII] = makeASCIISet(chars)
			if (isASCII) {
				for (let i = $.len(s) - 1; i >= 0; i--) {
					if (_as.contains($.indexString(s, i))) {
						return i
					}
				}
				return -1
			}
		}
	}
	if ($.len(chars) == 1) {
		let rc = ($.indexString(chars, 0) as number)
		if (rc >= utf8.RuneSelf) {
			rc = utf8.RuneError
		}
		for (let i = $.len(s); i > 0; ) {
			let [r, size] = utf8.DecodeLastRuneInString($.sliceString(s, undefined, i))
			i -= size
			if (rc == r) {
				return i
			}
		}
		return -1
	}
	for (let i = $.len(s); i > 0; ) {
		let [r, size] = utf8.DecodeLastRuneInString($.sliceString(s, undefined, i))
		i -= size
		if (IndexRune(chars, r) >= 0) {
			return i
		}
	}
	return -1
}

// LastIndexByte returns the index of the last instance of c in s, or -1 if c is not present in s.
export function LastIndexByte(s: string, c: number): number {
	return bytealg.LastIndexByteString(s, c)
}

// Generic split: splits after each instance of sep,
// including sepSave bytes of sep in the subarrays.
export function genSplit(s: string, sep: string, sepSave: number, n: number): $.Slice<string> {
	if (n == 0) {
		return null
	}
	if (sep == "") {
		return explode(s, n)
	}
	if (n < 0) {
		n = Count(s, sep) + 1
	}

	if (n > $.len(s) + 1) {
		n = $.len(s) + 1
	}
	let a = $.makeSlice<string>(n)
	n--
	let i = 0
	for (; i < n; ) {
		let m = Index(s, sep)
		if (m < 0) {
			break
		}
		a![i] = $.sliceString(s, undefined, m + sepSave)
		s = $.sliceString(s, m + $.len(sep), undefined)
		i++
	}
	a![i] = s
	return $.goSlice(a, undefined, i + 1)
}

// SplitN slices s into substrings separated by sep and returns a slice of
// the substrings between those separators.
//
// The count determines the number of substrings to return:
//   - n > 0: at most n substrings; the last substring will be the unsplit remainder;
//   - n == 0: the result is nil (zero substrings);
//   - n < 0: all substrings.
//
// Edge cases for s and sep (for example, empty strings) are handled
// as described in the documentation for [Split].
//
// To split around the first instance of a separator, see [Cut].
export function SplitN(s: string, sep: string, n: number): $.Slice<string> {
	return genSplit(s, sep, 0, n)
}

// SplitAfterN slices s into substrings after each instance of sep and
// returns a slice of those substrings.
//
// The count determines the number of substrings to return:
//   - n > 0: at most n substrings; the last substring will be the unsplit remainder;
//   - n == 0: the result is nil (zero substrings);
//   - n < 0: all substrings.
//
// Edge cases for s and sep (for example, empty strings) are handled
// as described in the documentation for [SplitAfter].
export function SplitAfterN(s: string, sep: string, n: number): $.Slice<string> {
	return genSplit(s, sep, $.len(sep), n)
}

// Split slices s into all substrings separated by sep and returns a slice of
// the substrings between those separators.
//
// If s does not contain sep and sep is not empty, Split returns a
// slice of length 1 whose only element is s.
//
// If sep is empty, Split splits after each UTF-8 sequence. If both s
// and sep are empty, Split returns an empty slice.
//
// It is equivalent to [SplitN] with a count of -1.
//
// To split around the first instance of a separator, see [Cut].
export function Split(s: string, sep: string): $.Slice<string> {
	return genSplit(s, sep, 0, -1)
}

// SplitAfter slices s into all substrings after each instance of sep and
// returns a slice of those substrings.
//
// If s does not contain sep and sep is not empty, SplitAfter returns
// a slice of length 1 whose only element is s.
//
// If sep is empty, SplitAfter splits after each UTF-8 sequence. If
// both s and sep are empty, SplitAfter returns an empty slice.
//
// It is equivalent to [SplitAfterN] with a count of -1.
export function SplitAfter(s: string, sep: string): $.Slice<string> {
	return genSplit(s, sep, $.len(sep), -1)
}

let asciiSpace = $.arrayToSlice<number>([/* unhandled keyed array literal key type */9: 1/* unhandled keyed array literal key type */10: 1/* unhandled keyed array literal key type */11: 1/* unhandled keyed array literal key type */12: 1/* unhandled keyed array literal key type */13: 1/* unhandled keyed array literal key type */32: 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

// Fields splits the string s around each instance of one or more consecutive white space
// characters, as defined by [unicode.IsSpace], returning a slice of substrings of s or an
// empty slice if s contains only white space.
export function Fields(s: string): $.Slice<string> {
	// First count the fields.
	// This is an exact count if s is ASCII, otherwise it is an approximation.
	let n = 0
	let wasSpace = 1
	// setBits is used to track which bits are set in the bytes of s.
	let setBits = (0 as number)
	for (let i = 0; i < $.len(s); i++) {
		let r = $.indexString(s, i)
		setBits |= r
		let isSpace = (asciiSpace![r] as number)
		n += (wasSpace & ~isSpace)
		wasSpace = isSpace
	}

	// Some runes in the input string are not ASCII.
	if (setBits >= utf8.RuneSelf) {
		// Some runes in the input string are not ASCII.
		return FieldsFunc(s, unicode.IsSpace)
	}
	// ASCII fast path
	let a = $.makeSlice<string>(n)
	let na = 0
	let fieldStart = 0
	let i = 0
	// Skip spaces in the front of the input.
	for (; i < $.len(s) && asciiSpace![$.indexString(s, i)] != 0; ) {
		i++
	}
	fieldStart = i

	// Skip spaces in between fields.
	for (; i < $.len(s); ) {
		if (asciiSpace![$.indexString(s, i)] == 0) {
			i++
			continue
		}
		a![na] = $.sliceString(s, fieldStart, i)
		na++
		i++
		// Skip spaces in between fields.
		for (; i < $.len(s) && asciiSpace![$.indexString(s, i)] != 0; ) {
			i++
		}
		fieldStart = i
	}
	// Last field might end at EOF.
	if (fieldStart < $.len(s)) {
		// Last field might end at EOF.
		a![na] = $.sliceString(s, fieldStart, undefined)
	}
	return a
}

// FieldsFunc splits the string s at each run of Unicode code points c satisfying f(c)
// and returns an array of slices of s. If all code points in s satisfy f(c) or the
// string is empty, an empty slice is returned.
//
// FieldsFunc makes no guarantees about the order in which it calls f(c)
// and assumes that f always returns the same value for a given c.
export function FieldsFunc(s: string, f: ((p0: number) => boolean) | null): $.Slice<string> {
	// A span is used to record a slice of s of the form s[start:end].
	// The start index is inclusive and the end index is exclusive.
	class span {
		public get start(): number {
			return this._fields.start.value
		}
		public set start(value: number) {
			this._fields.start.value = value
		}

		public get end(): number {
			return this._fields.end.value
		}
		public set end(value: number) {
			this._fields.end.value = value
		}

		public _fields: {
			start: $.VarRef<number>;
			end: $.VarRef<number>;
		}

		constructor(init?: Partial<{end?: number, start?: number}>) {
			this._fields = {
				start: $.varRef(init?.start ?? 0),
				end: $.varRef(init?.end ?? 0)
			}
		}

		public clone(): span {
			const cloned = new span()
			cloned._fields = {
				start: $.varRef(this._fields.start.value),
				end: $.varRef(this._fields.end.value)
			}
			return cloned
		}

		// Register this type with the runtime type system
		static __typeInfo = $.registerStructType(
		  'span',
		  new span(),
		  [],
		  span,
		  {"start": { kind: $.TypeKind.Basic, name: "number" }, "end": { kind: $.TypeKind.Basic, name: "number" }}
		);
	}
	let spans = $.makeSlice<span>(0, 32)

	// Find the field start and end indices.
	// Doing this in a separate pass (rather than slicing the string s
	// and collecting the result substrings right away) is significantly
	// more efficient, possibly due to cache effects.
	let start = -1 // valid span start if >= 0

	// Set start to a negative value.
	// Note: using -1 here consistently and reproducibly
	// slows down this code by a several percent on amd64.
	{
		const _runes = $.stringToRunes(s)
		for (let end = 0; end < _runes.length; end++) {
			const rune = _runes[i]
			{

				// Set start to a negative value.
				// Note: using -1 here consistently and reproducibly
				// slows down this code by a several percent on amd64.
				if (f!(rune)) {

					// Set start to a negative value.
					// Note: using -1 here consistently and reproducibly
					// slows down this code by a several percent on amd64.
					if (start >= 0) {
						spans = $.append(spans, new span({}))
						// Set start to a negative value.
						// Note: using -1 here consistently and reproducibly
						// slows down this code by a several percent on amd64.
						start = ~start
					}
				} else {
					if (start < 0) {
						start = end
					}
				}
			}
		}
	}

	// Last field might end at EOF.
	if (start >= 0) {
		spans = $.append(spans, new span({}))
	}

	// Create strings from recorded field indices.
	let a = $.makeSlice<string>($.len(spans))
	for (let i = 0; i < $.len(spans); i++) {
		const span = spans![i]
		{
			a![i] = $.sliceString(s, span.start, span.end)
		}
	}

	return a
}

// Join concatenates the elements of its first argument to create a single string. The separator
// string sep is placed between elements in the resulting string.
export function Join(elems: $.Slice<string>, sep: string): string {
	switch ($.len(elems)) {
		case 0:
			return ""
			break
		case 1:
			return elems![0]
			break
	}

	let n: number = 0
	if ($.len(sep) > 0) {
		if ($.len(sep) >= 9223372036854775807 / ($.len(elems) - 1)) {
			$.panic("strings: Join output length overflow")
		}
		n += $.len(sep) * ($.len(elems) - 1)
	}
	for (let _i = 0; _i < $.len(elems); _i++) {
		const elem = elems![_i]
		{
			if ($.len(elem) > 9223372036854775807 - n) {
				$.panic("strings: Join output length overflow")
			}
			n += $.len(elem)
		}
	}

	let b: Builder = new Builder()
	b.Grow(n)
	b.WriteString(elems![0])
	for (let _i = 0; _i < $.len($.goSlice(elems, 1, undefined)); _i++) {
		const s = $.goSlice(elems, 1, undefined)![_i]
		{
			b.WriteString(sep)
			b.WriteString(s)
		}
	}
	return b.String()
}

// HasPrefix reports whether the string s begins with prefix.
export function HasPrefix(s: string, prefix: string): boolean {
	return stringslite.HasPrefix(s, prefix)
}

// HasSuffix reports whether the string s ends with suffix.
export function HasSuffix(s: string, suffix: string): boolean {
	return stringslite.HasSuffix(s, suffix)
}

// Map returns a copy of the string s with all its characters modified
// according to the mapping function. If mapping returns a negative value, the character is
// dropped from the string with no replacement.
export function Map(mapping: ((p0: number) => number) | null, s: string): string {
	// In the worst case, the string can grow when mapped, making
	// things unpleasant. But it's so rare we barge in assuming it's
	// fine. It could also shrink but that falls out naturally.

	// The output buffer b is initialized on demand, the first
	// time a character differs.
	let b: Builder = new Builder()

	{
		const _runes = $.stringToRunes(s)
		for (let i = 0; i < _runes.length; i++) {
			const c = _runes[i]
			{
				let r = mapping!(c)
				if (r == c && c != utf8.RuneError) {
					continue
				}

				let width: number = 0
				if (c == utf8.RuneError) {
					[c, width] = utf8.DecodeRuneInString($.sliceString(s, i, undefined))
					if (width != 1 && r == c) {
						continue
					}
				} else {
					width = utf8.RuneLen(c)
				}

				b.Grow($.len(s) + utf8.UTFMax)
				b.WriteString($.sliceString(s, undefined, i))
				if (r >= 0) {
					b.WriteRune(r)
				}

				s = $.sliceString(s, i + width, undefined)
				break
			}
		}
	}

	// Fast path for unchanged input
	// didn't call b.Grow above
	if (b.Cap() == 0) {
		// didn't call b.Grow above
		return s
	}

	// common case
	// Due to inlining, it is more performant to determine if WriteByte should be
	// invoked rather than always call WriteRune

	// r is not an ASCII rune.
	{
		const _runes = $.stringToRunes(s)
		for (let i = 0; i < _runes.length; i++) {
			const c = _runes[i]
			{
				let r = mapping!(c)

				// common case
				// Due to inlining, it is more performant to determine if WriteByte should be
				// invoked rather than always call WriteRune

				// r is not an ASCII rune.
				if (r >= 0) {
					// common case
					// Due to inlining, it is more performant to determine if WriteByte should be
					// invoked rather than always call WriteRune

					// r is not an ASCII rune.
					if (r < utf8.RuneSelf) {
						b.WriteByte($.byte(r))
					} else {
						// r is not an ASCII rune.
						b.WriteRune(r)
					}
				}
			}
		}
	}

	return b.String()
}

let repeatedSpaces: string = "" + "                                                                " + "                                                                "

let repeatedDashes: string = "" + "----------------------------------------------------------------" + "----------------------------------------------------------------"

let repeatedZeroes: string = "" + "0000000000000000000000000000000000000000000000000000000000000000"

let repeatedEquals: string = "" + "================================================================" + "================================================================"

let repeatedTabs: string = "" + "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t" + "\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t"

// Repeat returns a new string consisting of count copies of the string s.
//
// It panics if count is negative or if the result of (len(s) * count)
// overflows.
export function Repeat(s: string, count: number): string {
	switch (count) {
		case 0:
			return ""
			break
		case 1:
			return s
			break
	}

	// Since we cannot return an error on overflow,
	// we should panic if the repeat will generate an overflow.
	// See golang.org/issue/16237.
	if (count < 0) {
		$.panic("strings: negative Repeat count")
	}
	let [hi, lo] = bits.Mul(($.len(s) as number), (count as number))
	if (hi > 0 || lo > (9223372036854775807 as number)) {
		$.panic("strings: Repeat output length overflow")
	}
	let n = (lo as number) // lo = len(s) * count

	if ($.len(s) == 0) {
		return ""
	}

	// Optimize for commonly repeated strings of relatively short length.
	switch ($.indexString(s, 0)) {
		case 32:
		case 45:
		case 48:
		case 61:
		case 9:
			switch (true) {
				case n <= $.len("                                                                    ...) && HasPrefix("                                                                    ..., s):
					return $.sliceString("                                                                    ..., undefined, n)
					break
				case n <= $.len("--------------------------------------------------------------------...) && HasPrefix("--------------------------------------------------------------------..., s):
					return $.sliceString("--------------------------------------------------------------------..., undefined, n)
					break
				case n <= $.len("0000000000000000000000000000000000000000000000000000000000000000") && HasPrefix("0000000000000000000000000000000000000000000000000000000000000000", s):
					return $.sliceString("0000000000000000000000000000000000000000000000000000000000000000", undefined, n)
					break
				case n <= $.len("====================================================================...) && HasPrefix("====================================================================..., s):
					return $.sliceString("====================================================================..., undefined, n)
					break
				case n <= $.len("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t...) && HasPrefix("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t..., s):
					return $.sliceString("\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t..., undefined, n)
					break
			}
			break
	}

	// Past a certain chunk size it is counterproductive to use
	// larger chunks as the source of the write, as when the source
	// is too large we are basically just thrashing the CPU D-cache.
	// So if the result length is larger than an empirically-found
	// limit (8KB), we stop growing the source string once the limit
	// is reached and keep reusing the same source string - that
	// should therefore be always resident in the L1 cache - until we
	// have completed the construction of the result.
	// This yields significant speedups (up to +100%) in cases where
	// the result length is large (roughly, over L2 cache size).
	let chunkLimit: number = 8 * 1024
	let chunkMax = n
	if (n > 8192) {
		chunkMax = 8192 / $.len(s) * $.len(s)
		if (chunkMax == 0) {
			chunkMax = $.len(s)
		}
	}

	let b: Builder = new Builder()
	b.Grow(n)
	b.WriteString(s)
	for (; b.Len() < n; ) {
		let chunk = min(n - b.Len(), b.Len(), chunkMax)
		b.WriteString($.sliceString(b.String(), undefined, chunk))
	}
	return b.String()
}

// ToUpper returns s with all Unicode letters mapped to their upper case.
export function ToUpper(s: string): string {
	let [isASCII, hasLower] = [true, false]
	for (let i = 0; i < $.len(s); i++) {
		let c = $.indexString(s, i)
		if (c >= utf8.RuneSelf) {
			isASCII = false
			break
		}
		hasLower = hasLower || (97 <= c && c <= 122)
	}

	// optimize for ASCII-only strings.
	if (isASCII) {
		// optimize for ASCII-only strings.
		if (!hasLower) {
			return s
		}
		let b: Builder = new Builder()
		let pos: number = 0
		b.Grow($.len(s))
		for (let i = 0; i < $.len(s); i++) {
			let c = $.indexString(s, i)
			if (97 <= c && c <= 122) {
				c -= 97 - 65
				if (pos < i) {
					b.WriteString($.sliceString(s, pos, i))
				}
				b.WriteByte(c)
				pos = i + 1
			}
		}
		if (pos < $.len(s)) {
			b.WriteString($.sliceString(s, pos, undefined))
		}
		return b.String()
	}
	return Map(unicode.ToUpper, s)
}

// ToLower returns s with all Unicode letters mapped to their lower case.
export function ToLower(s: string): string {
	let [isASCII, hasUpper] = [true, false]
	for (let i = 0; i < $.len(s); i++) {
		let c = $.indexString(s, i)
		if (c >= utf8.RuneSelf) {
			isASCII = false
			break
		}
		hasUpper = hasUpper || (65 <= c && c <= 90)
	}

	// optimize for ASCII-only strings.
	if (isASCII) {
		// optimize for ASCII-only strings.
		if (!hasUpper) {
			return s
		}
		let b: Builder = new Builder()
		let pos: number = 0
		b.Grow($.len(s))
		for (let i = 0; i < $.len(s); i++) {
			let c = $.indexString(s, i)
			if (65 <= c && c <= 90) {
				c += 97 - 65
				if (pos < i) {
					b.WriteString($.sliceString(s, pos, i))
				}
				b.WriteByte(c)
				pos = i + 1
			}
		}
		if (pos < $.len(s)) {
			b.WriteString($.sliceString(s, pos, undefined))
		}
		return b.String()
	}
	return Map(unicode.ToLower, s)
}

// ToTitle returns a copy of the string s with all Unicode letters mapped to
// their Unicode title case.
export function ToTitle(s: string): string {
	return Map(unicode.ToTitle, s)
}

// ToUpperSpecial returns a copy of the string s with all Unicode letters mapped to their
// upper case using the case mapping specified by c.
export function ToUpperSpecial(c: unicode.SpecialCase, s: string): string {
	return Map(c.ToUpper, s)
}

// ToLowerSpecial returns a copy of the string s with all Unicode letters mapped to their
// lower case using the case mapping specified by c.
export function ToLowerSpecial(c: unicode.SpecialCase, s: string): string {
	return Map(c.ToLower, s)
}

// ToTitleSpecial returns a copy of the string s with all Unicode letters mapped to their
// Unicode title case, giving priority to the special casing rules.
export function ToTitleSpecial(c: unicode.SpecialCase, s: string): string {
	return Map(c.ToTitle, s)
}

// ToValidUTF8 returns a copy of the string s with each run of invalid UTF-8 byte sequences
// replaced by the replacement string, which may be empty.
export function ToValidUTF8(s: string, replacement: string): string {
	let b: Builder = new Builder()

	{
		const _runes = $.stringToRunes(s)
		for (let i = 0; i < _runes.length; i++) {
			const c = _runes[i]
			{
				if (c != utf8.RuneError) {
					continue
				}

				let [, wid] = utf8.DecodeRuneInString($.sliceString(s, i, undefined))
				if (wid == 1) {
					b.Grow($.len(s) + $.len(replacement))
					b.WriteString($.sliceString(s, undefined, i))
					s = $.sliceString(s, i, undefined)
					break
				}
			}
		}
	}

	// Fast path for unchanged input
	// didn't call b.Grow above
	if (b.Cap() == 0) {
		// didn't call b.Grow above
		return s
	}

	let invalid = false // previous byte was from an invalid UTF-8 sequence
	for (let i = 0; i < $.len(s); ) {
		let c = $.indexString(s, i)
		if (c < utf8.RuneSelf) {
			i++
			invalid = false
			b.WriteByte(c)
			continue
		}
		let [, wid] = utf8.DecodeRuneInString($.sliceString(s, i, undefined))
		if (wid == 1) {
			i++
			if (!invalid) {
				invalid = true
				b.WriteString(replacement)
			}
			continue
		}
		invalid = false
		b.WriteString($.sliceString(s, i, i + wid))
		i += wid
	}

	return b.String()
}

// isSeparator reports whether the rune could mark a word boundary.
// TODO: update when package unicode captures more of the properties.
export function isSeparator(r: number): boolean {
	// ASCII alphanumerics and underscore are not separators
	if (r <= 0x7F) {
		switch (true) {
			case 48 <= r && r <= 57:
				return false
				break
			case 97 <= r && r <= 122:
				return false
				break
			case 65 <= r && r <= 90:
				return false
				break
			case r == 95:
				return false
				break
		}
		return true
	}
	// Letters and digits are not separators
	if (unicode.IsLetter(r) || unicode.IsDigit(r)) {
		return false
	}
	// Otherwise, all we can do for now is treat spaces as separators.
	return unicode.IsSpace(r)
}

// Title returns a copy of the string s with all Unicode letters that begin words
// mapped to their Unicode title case.
//
// Deprecated: The rule Title uses for word boundaries does not handle Unicode
// punctuation properly. Use golang.org/x/text/cases instead.
export function Title(s: string): string {
	// Use a closure here to remember state.
	// Hackish but effective. Depends on Map scanning in order and calling
	// the closure once per rune.
	let prev = 32
	return Map((r: number): number => {
		if (isSeparator(prev)) {
			prev = r
			return unicode.ToTitle(r)
		}
		prev = r
		return r
	}
	, s)
}

// TrimLeftFunc returns a slice of the string s with all leading
// Unicode code points c satisfying f(c) removed.
export function TrimLeftFunc(s: string, f: ((p0: number) => boolean) | null): string {
	let i = indexFunc(s, f, false)
	if (i == -1) {
		return ""
	}
	return $.sliceString(s, i, undefined)
}

// TrimRightFunc returns a slice of the string s with all trailing
// Unicode code points c satisfying f(c) removed.
export function TrimRightFunc(s: string, f: ((p0: number) => boolean) | null): string {
	let i = lastIndexFunc(s, f, false)
	if (i >= 0 && $.indexString(s, i) >= utf8.RuneSelf) {
		let [, wid] = utf8.DecodeRuneInString($.sliceString(s, i, undefined))
		i += wid
	} else {
		i++
	}
	return $.sliceString(s, 0, i)
}

// TrimFunc returns a slice of the string s with all leading
// and trailing Unicode code points c satisfying f(c) removed.
export function TrimFunc(s: string, f: ((p0: number) => boolean) | null): string {
	return TrimRightFunc(TrimLeftFunc(s, f), f)
}

// IndexFunc returns the index into s of the first Unicode
// code point satisfying f(c), or -1 if none do.
export function IndexFunc(s: string, f: ((p0: number) => boolean) | null): number {
	return indexFunc(s, f, true)
}

// LastIndexFunc returns the index into s of the last
// Unicode code point satisfying f(c), or -1 if none do.
export function LastIndexFunc(s: string, f: ((p0: number) => boolean) | null): number {
	return lastIndexFunc(s, f, true)
}

// indexFunc is the same as IndexFunc except that if
// truth==false, the sense of the predicate function is
// inverted.
export function indexFunc(s: string, f: ((p0: number) => boolean) | null, truth: boolean): number {
	{
		const _runes = $.stringToRunes(s)
		for (let i = 0; i < _runes.length; i++) {
			const r = _runes[i]
			{
				if (f!(r) == truth) {
					return i
				}
			}
		}
	}
	return -1
}

// lastIndexFunc is the same as LastIndexFunc except that if
// truth==false, the sense of the predicate function is
// inverted.
export function lastIndexFunc(s: string, f: ((p0: number) => boolean) | null, truth: boolean): number {
	for (let i = $.len(s); i > 0; ) {
		let [r, size] = utf8.DecodeLastRuneInString($.sliceString(s, 0, i))
		i -= size
		if (f!(r) == truth) {
			return i
		}
	}
	return -1
}

type asciiSet = number[];

// makeASCIISet creates a set of ASCII characters and reports whether all
// characters in chars are ASCII.
export function makeASCIISet(chars: string): [asciiSet, boolean] {
	let as: asciiSet = [0, 0, 0, 0, 0, 0, 0, 0]
	let ok: boolean = false
	{
		for (let i = 0; i < $.len(chars); i++) {
			let c = $.indexString(chars, i)
			if (c >= utf8.RuneSelf) {
				return [_as, false]
			}
			_as![c / 32] |= (1 << (c % 32))
		}
		return [_as, true]
	}
}

// Trim returns a slice of the string s with all leading and
// trailing Unicode code points contained in cutset removed.
export function Trim(s: string, cutset: string): string {
	if (s == "" || cutset == "") {
		return s
	}
	if ($.len(cutset) == 1 && $.indexString(cutset, 0) < utf8.RuneSelf) {
		return trimLeftByte(trimRightByte(s, $.indexString(cutset, 0)), $.indexString(cutset, 0))
	}
	{
		let [_as, ok] = makeASCIISet(cutset)
		if (ok) {
			return trimLeftASCII(trimRightASCII(s, _as), _as)
		}
	}
	return trimLeftUnicode(trimRightUnicode(s, cutset), cutset)
}

// TrimLeft returns a slice of the string s with all leading
// Unicode code points contained in cutset removed.
//
// To remove a prefix, use [TrimPrefix] instead.
export function TrimLeft(s: string, cutset: string): string {
	if (s == "" || cutset == "") {
		return s
	}
	if ($.len(cutset) == 1 && $.indexString(cutset, 0) < utf8.RuneSelf) {
		return trimLeftByte(s, $.indexString(cutset, 0))
	}
	{
		let [_as, ok] = makeASCIISet(cutset)
		if (ok) {
			return trimLeftASCII(s, _as)
		}
	}
	return trimLeftUnicode(s, cutset)
}

export function trimLeftByte(s: string, c: number): string {
	for (; $.len(s) > 0 && $.indexString(s, 0) == c; ) {
		s = $.sliceString(s, 1, undefined)
	}
	return s
}

export function trimLeftASCII(s: string, _as: $.VarRef<asciiSet> | null): string {
	for (; $.len(s) > 0; ) {
		if (!_as!.contains($.indexString(s, 0))) {
			break
		}
		s = $.sliceString(s, 1, undefined)
	}
	return s
}

export function trimLeftUnicode(s: string, cutset: string): string {
	for (; $.len(s) > 0; ) {
		let [r, n] = [($.indexString(s, 0) as number), 1]
		if (r >= utf8.RuneSelf) {
			[r, n] = utf8.DecodeRuneInString(s)
		}
		if (!ContainsRune(cutset, r)) {
			break
		}
		s = $.sliceString(s, n, undefined)
	}
	return s
}

// TrimRight returns a slice of the string s, with all trailing
// Unicode code points contained in cutset removed.
//
// To remove a suffix, use [TrimSuffix] instead.
export function TrimRight(s: string, cutset: string): string {
	if (s == "" || cutset == "") {
		return s
	}
	if ($.len(cutset) == 1 && $.indexString(cutset, 0) < utf8.RuneSelf) {
		return trimRightByte(s, $.indexString(cutset, 0))
	}
	{
		let [_as, ok] = makeASCIISet(cutset)
		if (ok) {
			return trimRightASCII(s, _as)
		}
	}
	return trimRightUnicode(s, cutset)
}

export function trimRightByte(s: string, c: number): string {
	for (; $.len(s) > 0 && $.indexString(s, $.len(s) - 1) == c; ) {
		s = $.sliceString(s, undefined, $.len(s) - 1)
	}
	return s
}

export function trimRightASCII(s: string, _as: $.VarRef<asciiSet> | null): string {
	for (; $.len(s) > 0; ) {
		if (!_as!.contains($.indexString(s, $.len(s) - 1))) {
			break
		}
		s = $.sliceString(s, undefined, $.len(s) - 1)
	}
	return s
}

export function trimRightUnicode(s: string, cutset: string): string {
	for (; $.len(s) > 0; ) {
		let [r, n] = [($.indexString(s, $.len(s) - 1) as number), 1]
		if (r >= utf8.RuneSelf) {
			[r, n] = utf8.DecodeLastRuneInString(s)
		}
		if (!ContainsRune(cutset, r)) {
			break
		}
		s = $.sliceString(s, undefined, $.len(s) - n)
	}
	return s
}

// TrimSpace returns a slice of the string s, with all leading
// and trailing white space removed, as defined by Unicode.
export function TrimSpace(s: string): string {
	// Fast path for ASCII: look for the first ASCII non-space byte
	let start = 0

	// If we run into a non-ASCII byte, fall back to the
	// slower unicode-aware method on the remaining bytes
	for (; start < $.len(s); start++) {
		let c = $.indexString(s, start)

		// If we run into a non-ASCII byte, fall back to the
		// slower unicode-aware method on the remaining bytes
		if (c >= utf8.RuneSelf) {
			// If we run into a non-ASCII byte, fall back to the
			// slower unicode-aware method on the remaining bytes
			return TrimFunc($.sliceString(s, start, undefined), unicode.IsSpace)
		}
		if (asciiSpace![c] == 0) {
			break
		}
	}

	// Now look for the first ASCII non-space byte from the end
	let stop = $.len(s)

	// start has been already trimmed above, should trim end only
	for (; stop > start; stop--) {
		let c = $.indexString(s, stop - 1)

		// start has been already trimmed above, should trim end only
		if (c >= utf8.RuneSelf) {
			// start has been already trimmed above, should trim end only
			return TrimRightFunc($.sliceString(s, start, stop), unicode.IsSpace)
		}
		if (asciiSpace![c] == 0) {
			break
		}
	}

	// At this point s[start:stop] starts and ends with an ASCII
	// non-space bytes, so we're done. Non-ASCII cases have already
	// been handled above.
	return $.sliceString(s, start, stop)
}

// TrimPrefix returns s without the provided leading prefix string.
// If s doesn't start with prefix, s is returned unchanged.
export function TrimPrefix(s: string, prefix: string): string {
	return stringslite.TrimPrefix(s, prefix)
}

// TrimSuffix returns s without the provided trailing suffix string.
// If s doesn't end with suffix, s is returned unchanged.
export function TrimSuffix(s: string, suffix: string): string {
	return stringslite.TrimSuffix(s, suffix)
}

// Replace returns a copy of the string s with the first n
// non-overlapping instances of old replaced by new.
// If old is empty, it matches at the beginning of the string
// and after each UTF-8 sequence, yielding up to k+1 replacements
// for a k-rune string.
// If n < 0, there is no limit on the number of replacements.
export function Replace(s: string, old: string, _new: string, n: number): string {

	// avoid allocation
	if (old == _new || n == 0) {
		return s
	}

	// Compute number of replacements.

	// avoid allocation
	{
		let m = Count(s, old)
		if (m == 0) {
			return s
		} else if (n < 0 || m < n) {
			n = m
		}
	}

	// Apply replacements to buffer.
	let b: Builder = new Builder()
	b.Grow($.len(s) + n * ($.len(_new) - $.len(old)))
	let start = 0
	for (let i = 0; i < n; i++) {
		let j = start
		if ($.len(old) == 0) {
			if (i > 0) {
				let [, wid] = utf8.DecodeRuneInString($.sliceString(s, start, undefined))
				j += wid
			}
		} else {
			j += Index($.sliceString(s, start, undefined), old)
		}
		b.WriteString($.sliceString(s, start, j))
		b.WriteString(_new)
		start = j + $.len(old)
	}
	b.WriteString($.sliceString(s, start, undefined))
	return b.String()
}

// ReplaceAll returns a copy of the string s with all
// non-overlapping instances of old replaced by new.
// If old is empty, it matches at the beginning of the string
// and after each UTF-8 sequence, yielding up to k+1 replacements
// for a k-rune string.
export function ReplaceAll(s: string, old: string, _new: string): string {
	return Replace(s, old, _new, -1)
}

// EqualFold reports whether s and t, interpreted as UTF-8 strings,
// are equal under simple Unicode case-folding, which is a more general
// form of case-insensitivity.
export function EqualFold(s: string, t: string): boolean {
	// ASCII fast path
	let i = 0

	// Easy case.

	// Make sr < tr to simplify what follows.

	// ASCII only, sr/tr must be upper/lower case
	for (; i < $.len(s) && i < $.len(t); i++) {
		let sr = $.indexString(s, i)
		let tr = $.indexString(t, i)
		if ((sr | tr) >= utf8.RuneSelf) {
			// unhandled branch statement token: goto
		}

		// Easy case.
		if (tr == sr) {
			continue
		}

		// Make sr < tr to simplify what follows.
		if (tr < sr) {
			[tr, sr] = [sr, tr]
		}
		// ASCII only, sr/tr must be upper/lower case
		if (65 <= sr && sr <= 90 && tr == sr + 97 - 65) {
			continue
		}
		return false
	}
	// Check if we've exhausted both strings.
	return $.len(s) == $.len(t)

	hasUnicode: s = $.sliceString(s, i, undefined)
	t = $.sliceString(t, i, undefined)

	// If t is exhausted the strings are not equal.

	// Extract first rune from second string.

	// If they match, keep going; if not, return false.

	// Easy case.

	// Make sr < tr to simplify what follows.

	// Fast check for ASCII.

	// ASCII only, sr/tr must be upper/lower case

	// General case. SimpleFold(x) returns the next equivalent rune > x
	// or wraps around to smaller values.
	{
		const _runes = $.stringToRunes(s)
		for (let i = 0; i < _runes.length; i++) {
			const sr = _runes[i]
			{
				// If t is exhausted the strings are not equal.
				if ($.len(t) == 0) {
					return false
				}

				// Extract first rune from second string.
				let tr: number = 0
				if ($.indexString(t, 0) < utf8.RuneSelf) {
					[tr, t] = [($.indexString(t, 0) as number), $.sliceString(t, 1, undefined)]
				} else {
					let [r, size] = utf8.DecodeRuneInString(t)
					[tr, t] = [r, $.sliceString(t, size, undefined)]
				}

				// If they match, keep going; if not, return false.

				// Easy case.
				if (tr == sr) {
					continue
				}

				// Make sr < tr to simplify what follows.
				if (tr < sr) {
					[tr, sr] = [sr, tr]
				}
				// Fast check for ASCII.

				// ASCII only, sr/tr must be upper/lower case
				if (tr < utf8.RuneSelf) {
					// ASCII only, sr/tr must be upper/lower case
					if (65 <= sr && sr <= 90 && tr == sr + 97 - 65) {
						continue
					}
					return false
				}

				// General case. SimpleFold(x) returns the next equivalent rune > x
				// or wraps around to smaller values.
				let r = unicode.SimpleFold(sr)
				for (; r != sr && r < tr; ) {
					r = unicode.SimpleFold(r)
				}
				if (r == tr) {
					continue
				}
				return false
			}
		}
	}

	// First string is empty, so check if the second one is also empty.
	return $.len(t) == 0
}

// Index returns the index of the first instance of substr in s, or -1 if substr is not present in s.
export function Index(s: string, substr: string): number {
	return stringslite.Index(s, substr)
}

// Cut slices s around the first instance of sep,
// returning the text before and after sep.
// The found result reports whether sep appears in s.
// If sep does not appear in s, cut returns s, "", false.
export function Cut(s: string, sep: string): [string, boolean] {
	let before: string = ""
	let after: string = ""
	let found: boolean = false
	{
		return stringslite.Cut(s, sep)
	}
}

// CutPrefix returns s without the provided leading prefix string
// and reports whether it found the prefix.
// If s doesn't start with prefix, CutPrefix returns s, false.
// If prefix is the empty string, CutPrefix returns s, true.
export function CutPrefix(s: string, prefix: string): [string, boolean] {
	let after: string = ""
	let found: boolean = false
	{
		return stringslite.CutPrefix(s, prefix)
	}
}

// CutSuffix returns s without the provided ending suffix string
// and reports whether it found the suffix.
// If s doesn't end with suffix, CutSuffix returns s, false.
// If suffix is the empty string, CutSuffix returns s, true.
export function CutSuffix(s: string, suffix: string): [string, boolean] {
	let before: string = ""
	let found: boolean = false
	{
		return stringslite.CutSuffix(s, suffix)
	}
}

