import * as $ from "@goscript/builtin/index.js";


import * as unicode from "@goscript/unicode/index.js"

import * as utf8 from "@goscript/unicode/utf8/index.js"

// for linkname
import * as _ from "@goscript/unsafe/index.js"

// Equal reports whether a and b
// are the same length and contain the same bytes.
// A nil argument is equivalent to an empty slice.
export function Equal(a: $.Bytes, b: $.Bytes): boolean {
	return $.bytesEqual(a, b)
}

// Compare returns an integer comparing two byte slices lexicographically.
// The result will be 0 if a == b, -1 if a < b, and +1 if a > b.
// A nil argument is equivalent to an empty slice.
export function Compare(a: $.Bytes, b: $.Bytes): number {
	return $.bytesCompare(a, b)
}

// explode splits s into a slice of UTF-8 sequences, one per Unicode code point (still slices of bytes),
// up to a maximum of n byte slices. Invalid UTF-8 sequences are chopped into individual bytes.
export function explode(s: $.Bytes, n: number): $.Slice<$.Bytes> {
	if (n === 0) {
		return null
	}
	
	if (s === null || $.len(s) === 0) {
		return null
	}
	
	const result: $.Bytes[] = []
	let i = 0
	
	while (i < $.len(s) && (n < 0 || result.length < n)) {
		const [, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8, take single byte
			result.push($.goSlice(s, i, i + 1))
			i++
		} else {
			result.push($.goSlice(s, i, i + size))
			i += size
		}
	}
	
	// If we have remaining bytes and haven't reached n limit, add the rest
	if (i < $.len(s) && (n < 0 || result.length < n)) {
		result.push($.goSlice(s, i, undefined))
	}
	
	return $.arrayToSlice(result)
}

// Count counts the number of non-overlapping instances of sep in s.
// If sep is an empty slice, Count returns 1 + the number of UTF-8-encoded code points in s.
export function Count(s: $.Bytes, sep: $.Bytes): number {
	// Special case for empty separator
	if (sep === null || $.len(sep) === 0) {
		if (s === null) return 1
		// For now, use simple byte count + 1 (TODO: proper UTF-8 rune counting)
		return $.len(s) + 1
	}
	
	// Single byte separator - optimized path
	if ($.len(sep) === 1) {
		return $.bytesCount(s, sep)
	}
	
	return $.bytesCount(s, sep)
}

// Contains reports whether subslice is within b.
export function Contains(b: $.Bytes, subslice: $.Bytes): boolean {
	return Index(b, subslice) !== -1
}

// ContainsAny reports whether any of the UTF-8-encoded code points in chars are within b.
export function ContainsAny(b: $.Bytes, chars: string): boolean {
	return IndexAny(b, chars) >= 0
}

// ContainsRune reports whether the rune is contained in the UTF-8-encoded byte slice b.
export function ContainsRune(b: $.Bytes, r: number): boolean {
	return IndexRune(b, r) >= 0
}

// ContainsFunc reports whether any of the UTF-8-encoded code points r within b satisfy f(r).
export function ContainsFunc(b: $.Bytes, f: ((p0: number) => boolean) | null): boolean {
	return IndexFunc(b, f) >= 0
}

// IndexByte returns the index of the first instance of c in b, or -1 if c is not present in b.
export function IndexByte(b: $.Bytes, c: number): number {
	return $.bytesIndexByte(b, c)
}

export function indexBytePortable(s: $.Bytes, c: number): number {
	if (s === null) return -1
	const arr = $.bytesToArray(s)
	return arr.indexOf(c)
}

// LastIndex returns the index of the last instance of sep in s, or -1 if sep is not present in s.
export function LastIndex(s: $.Bytes, sep: $.Bytes): number {
	if (sep === null || $.len(sep) === 0) {
		return s === null ? 0 : $.len(s)
	}
	
	if ($.len(sep) === 1) {
		return $.bytesLastIndexByte(s, sep![0])
	}
	
	return $.bytesLastIndexOf(s, sep)
}

// LastIndexByte returns the index of the last instance of c in s, or -1 if c is not present in s.
export function LastIndexByte(s: $.Bytes, c: number): number {
	return $.bytesLastIndexByte(s, c)
}

// IndexRune interprets s as a sequence of UTF-8-encoded code points.
// It returns the byte index of the first occurrence in s of the given rune.
// It returns -1 if rune is not present in s.
// If r is [utf8.RuneError], it returns the first instance of any
// invalid UTF-8 byte sequence.
export function IndexRune(s: $.Bytes, r: number): number {
	if (s === null) {
		return -1
	}
	
	if (r < utf8.RuneSelf) {
		// ASCII case - use IndexByte for efficiency
		return IndexByte(s, r)
	}
	
	if (r === utf8.RuneError) {
		// Look for invalid UTF-8 sequences
		for (let i = 0; i < $.len(s); ) {
			const [r1, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
			if (r1 === utf8.RuneError && size === 1) {
				return i
			}
			if (size <= 0) {
				return i
			}
			i += size
		}
		return -1
	}
	
	// Encode the rune to bytes and search for it
	const runeBytes = new Uint8Array(4)
	const n = utf8.EncodeRune(runeBytes as $.Bytes, r)
	const needle = $.goSlice(runeBytes as $.Bytes, 0, n)
	
	return Index(s, needle)
}

// IndexAny interprets s as a sequence of UTF-8-encoded Unicode code points.
// It returns the byte index of the first occurrence in s of any of the Unicode
// code points in chars. It returns -1 if chars is empty or if there is no code
// point in common.
export function IndexAny(s: $.Bytes, chars: string): number {
	if (s === null || chars.length === 0) {
		return -1
	}
	
	// Check if all chars are ASCII for optimization
	let allASCII = true
	for (let i = 0; i < chars.length; i++) {
		if (chars.charCodeAt(i) >= utf8.RuneSelf) {
			allASCII = false
			break
		}
	}
	
	if (allASCII) {
		// ASCII optimization
		for (let i = 0; i < $.len(s); i++) {
			const b = s![i]
			if (b < utf8.RuneSelf && chars.indexOf(String.fromCharCode(b)) >= 0) {
				return i
			}
		}
		return -1
	}
	
	// Full UTF-8 handling
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			i++
			continue
		}
		
		// Check if this rune is in chars
		if (containsRune(chars, r)) {
			return i
		}
		
		i += size
	}
	
	return -1
}

// LastIndexAny interprets s as a sequence of UTF-8-encoded Unicode code
// points. It returns the byte index of the last occurrence in s of any of
// the Unicode code points in chars. It returns -1 if chars is empty or if
// there is no code point in common.
export function LastIndexAny(s: $.Bytes, chars: string): number {
	if (s === null || chars.length === 0) {
		return -1
	}
	
	// Check if all chars are ASCII for optimization
	let allASCII = true
	for (let i = 0; i < chars.length; i++) {
		if (chars.charCodeAt(i) >= utf8.RuneSelf) {
			allASCII = false
			break
		}
	}
	
	if (allASCII) {
		// ASCII optimization - search backwards
		for (let i = $.len(s) - 1; i >= 0; i--) {
			const b = s![i]
			if (b < utf8.RuneSelf && chars.indexOf(String.fromCharCode(b)) >= 0) {
				return i
			}
		}
		return -1
	}
	
	// Full UTF-8 handling - need to scan forward to find rune boundaries
	let lastIndex = -1
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			i++
			continue
		}
		
		// Check if this rune is in chars
		if (containsRune(chars, r)) {
			lastIndex = i
		}
		
		i += size
	}
	
	return lastIndex
}

// Generic split: splits after each instance of sep,
// including sepSave bytes of sep in the subslices.
export function genSplit(s: $.Bytes, sep: $.Bytes, sepSave: number, n: number): $.Slice<$.Bytes> {
	if (n === 0) {
		return null
	}
	
	if (sep === null || $.len(sep) === 0) {
		return explode(s, n)
	}
	
	if (n < 0) {
		n = Count(s, sep) + 1
	}
	
	if (n > Count(s, sep) + 1) {
		n = Count(s, sep) + 1
	}
	
	const result: $.Bytes[] = []
	let start = 0
	
	for (let i = 0; i < n - 1; i++) {
		const m = Index($.goSlice(s, start, undefined), sep)
		if (m < 0) {
			break
		}
		const end = start + m + sepSave
		result.push($.goSlice(s, start, end))
		start += m + $.len(sep)
	}
	
	// Add the remaining part
	result.push($.goSlice(s, start, undefined))
	
	return $.arrayToSlice(result)
}

// SplitN slices s into subslices separated by sep and returns a slice of
// the subslices between those separators.
// If sep is empty, SplitN splits after each UTF-8 sequence.
// The count determines the number of subslices to return:
//   - n > 0: at most n subslices; the last subslice will be the unsplit remainder;
//   - n == 0: the result is nil (zero subslices);
//   - n < 0: all subslices.
//
// To split around the first instance of a separator, see [Cut].
export function SplitN(s: $.Bytes, sep: $.Bytes, n: number): $.Slice<$.Bytes> {
	return genSplit(s, sep, 0, n)
}

// SplitAfterN slices s into subslices after each instance of sep and
// returns a slice of those subslices.
// If sep is empty, SplitAfterN splits after each UTF-8 sequence.
// The count determines the number of subslices to return:
//   - n > 0: at most n subslices; the last subslice will be the unsplit remainder;
//   - n == 0: the result is nil (zero subslices);
//   - n < 0: all subslices.
export function SplitAfterN(s: $.Bytes, sep: $.Bytes, n: number): $.Slice<$.Bytes> {
	return genSplit(s, sep, $.len(sep), n)
}

// Split slices s into all subslices separated by sep and returns a slice of
// the subslices between those separators.
// If sep is empty, Split splits after each UTF-8 sequence.
// It is equivalent to SplitN with a count of -1.
//
// To split around the first instance of a separator, see [Cut].
export function Split(s: $.Bytes, sep: $.Bytes): $.Slice<$.Bytes> {
	return genSplit(s, sep, 0, -1)
}

// SplitAfter slices s into all subslices after each instance of sep and
// returns a slice of those subslices.
// If sep is empty, SplitAfter splits after each UTF-8 sequence.
// It is equivalent to SplitAfterN with a count of -1.
export function SplitAfter(s: $.Bytes, sep: $.Bytes): $.Slice<$.Bytes> {
	return genSplit(s, sep, $.len(sep), -1)
}

export let asciiSpace = $.arrayToSlice<number>([0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0])

// Fields interprets s as a sequence of UTF-8-encoded code points.
// It splits the slice s around each instance of one or more consecutive white space
// characters, as defined by [unicode.IsSpace], returning a slice of subslices of s or an
// empty slice if s contains only white space.
export function Fields(s: $.Bytes): $.Slice<$.Bytes> {
	// Use FieldsFunc with unicode.IsSpace
	return FieldsFunc(s, unicode.IsSpace)
}

// FieldsFunc interprets s as a sequence of UTF-8-encoded code points.
// It splits the slice s at each run of code points c satisfying f(c) and
// returns a slice of subslices of s. If all code points in s satisfy f(c), or
// len(s) == 0, an empty slice is returned.
//
// FieldsFunc makes no guarantees about the order in which it calls f(c)
// and assumes that f always returns the same value for a given c.
export function FieldsFunc(s: $.Bytes, f: ((p0: number) => boolean) | null): $.Slice<$.Bytes> {
	if (s === null || f === null) {
		return null
	}
	
	const result: $.Bytes[] = []
	let start = -1
	
	for (let i = 0; i < $.len(s); ) {
		let size = 1
		let r = s![i]
		
		if (r >= utf8.RuneSelf) {
			const [rune, runeSize] = utf8.DecodeRune($.goSlice(s, i, undefined))
			r = rune
			size = runeSize
		}
		
		if (f(r)) {
			// Found separator
			if (start >= 0) {
				result.push($.goSlice(s, start, i))
				start = -1
			}
		} else if (start < 0) {
			// Start of new field
			start = i
		}
		
		i += size
	}
	
	// Add final field if any
	if (start >= 0) {
		result.push($.goSlice(s, start, undefined))
	}
	
	return result.length === 0 ? null : $.arrayToSlice(result)
}

// Join concatenates the elements of s to create a new byte slice. The separator
// sep is placed between elements in the resulting slice.
export function Join(s: $.Slice<$.Bytes>, sep: $.Bytes): $.Bytes {
	if (s === null || $.len(s) === 0) {
		return new Uint8Array(0)
	}

	// Just return a copy for single element
	if ($.len(s) === 1) {
		if (s![0] === null) return new Uint8Array(0)
		return new Uint8Array($.bytesToArray(s![0]))
	}

	// Calculate total length needed
	let totalLen = 0
	const sepLen = sep === null ? 0 : $.len(sep)
	
	for (let i = 0; i < $.len(s); i++) {
		const elem = s![i]
		if (elem !== null) {
			totalLen += $.len(elem)
		}
	}
	
	if (sepLen > 0) {
		totalLen += sepLen * ($.len(s) - 1)
	}

	// Build result
	const result = new Uint8Array(totalLen)
	let pos = 0
	
	for (let i = 0; i < $.len(s); i++) {
		if (i > 0 && sepLen > 0) {
			const sepArr = $.bytesToArray(sep)
			for (let j = 0; j < sepArr.length; j++) {
				result[pos++] = sepArr[j]
			}
		}
		
		const elem = s![i]
		if (elem !== null) {
			const elemArr = $.bytesToArray(elem)
			for (let j = 0; j < elemArr.length; j++) {
				result[pos++] = elemArr[j]
			}
		}
	}

	return result
}

// HasPrefix reports whether the byte slice s begins with prefix.
export function HasPrefix(s: $.Bytes, prefix: $.Bytes): boolean {
	if (s === null) s = new Uint8Array(0)
	if (prefix === null) prefix = new Uint8Array(0)
	
	if ($.len(s) < $.len(prefix)) return false
	
	const sArr = $.bytesToArray(s)
	const prefixArr = $.bytesToArray(prefix)
	
	for (let i = 0; i < prefixArr.length; i++) {
		if (sArr[i] !== prefixArr[i]) return false
	}
	
	return true
}

// HasSuffix reports whether the byte slice s ends with suffix.
export function HasSuffix(s: $.Bytes, suffix: $.Bytes): boolean {
	if (s === null) s = new Uint8Array(0)
	if (suffix === null) suffix = new Uint8Array(0)
	
	if ($.len(s) < $.len(suffix)) return false
	
	const sArr = $.bytesToArray(s)
	const suffixArr = $.bytesToArray(suffix)
	const offset = sArr.length - suffixArr.length
	
	for (let i = 0; i < suffixArr.length; i++) {
		if (sArr[offset + i] !== suffixArr[i]) return false
	}
	
	return true
}

// Map returns a copy of the byte slice s with all its characters modified
// according to the mapping function. If mapping returns a negative value, the character is
// dropped from the byte slice with no replacement. The characters in s and the
// output are interpreted as UTF-8-encoded code points.
export function Map(mapping: ((r: number) => number) | null, s: $.Bytes): $.Bytes {
	if (s === null || $.len(s) === 0 || mapping === null) {
		return s === null ? null : new Uint8Array(0)
	}
	
	const result: number[] = []
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8, copy the byte as-is
			result.push(s![i])
			i++
		} else {
			const mappedR = mapping(r)
			if (mappedR >= 0) {
				// Encode the mapped rune back to bytes
				const runeBytes = new Uint8Array(utf8.UTFMax)
				const n = utf8.EncodeRune(runeBytes, mappedR)
				
				// Add the encoded bytes to result
				for (let j = 0; j < n; j++) {
					result.push(runeBytes[j])
				}
			}
			
			i += size
		}
	}
	
	return new Uint8Array(result)
}

// Repeat returns a new byte slice consisting of count copies of b.
//
// It panics if count is negative or if the result of (len(b) * count)
// overflows.
export function Repeat(b: $.Bytes, count: number): $.Bytes {
	if (count === 0) {
		return new Uint8Array(0)
	}

	if (count < 0) {
		$.panic("bytes: negative Repeat count")
	}
	
	if (b === null || $.len(b) === 0) {
		return new Uint8Array(0)
	}
	
	const bArr = $.bytesToArray(b)
	const totalLen = bArr.length * count
	
	// Check for overflow
	if (totalLen / count !== bArr.length) {
		$.panic("bytes: Repeat output length overflow")
	}
	
	const result = new Uint8Array(totalLen)
	let pos = 0
	
	for (let i = 0; i < count; i++) {
		for (let j = 0; j < bArr.length; j++) {
			result[pos++] = bArr[j]
		}
	}
	
	return result
}

// ToUpper returns a copy of the byte slice s with all Unicode letters mapped to
// their upper case.
export function ToUpper(s: $.Bytes): $.Bytes {
	if (s === null || $.len(s) === 0) {
		return new Uint8Array(0)
	}
	
	const result: number[] = []
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8, copy the byte as-is
			result.push(s![i])
			i++
		} else {
			// Convert rune to uppercase
			const upperR = unicode.ToUpper(r)
			
			// Encode the uppercase rune back to bytes
			const runeBytes = new Uint8Array(utf8.UTFMax)
			const n = utf8.EncodeRune(runeBytes, upperR)
			
			// Add the encoded bytes to result
			for (let j = 0; j < n; j++) {
				result.push(runeBytes[j])
			}
			
			i += size
		}
	}
	
	return new Uint8Array(result)
}

// ToLower returns a copy of the byte slice s with all Unicode letters mapped to
// their lower case.
export function ToLower(s: $.Bytes): $.Bytes {
	if (s === null || $.len(s) === 0) {
		return new Uint8Array(0)
	}
	
	const result: number[] = []
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8, copy the byte as-is
			result.push(s![i])
			i++
		} else {
			// Convert rune to lowercase
			const lowerR = unicode.ToLower(r)
			
			// Encode the lowercase rune back to bytes
			const runeBytes = new Uint8Array(utf8.UTFMax)
			const n = utf8.EncodeRune(runeBytes, lowerR)
			
			// Add the encoded bytes to result
			for (let j = 0; j < n; j++) {
				result.push(runeBytes[j])
			}
			
			i += size
		}
	}
	
	return new Uint8Array(result)
}

// ToTitle treats s as UTF-8-encoded bytes and returns a copy with all the Unicode letters mapped to their title case.
export function ToTitle(s: $.Bytes): $.Bytes {
	return Map(unicode.ToTitle, s)
}

// ToUpperSpecial treats s as UTF-8-encoded bytes and returns a copy with all the Unicode letters mapped to their
// upper case, giving priority to the special casing rules.
export function ToUpperSpecial(c: unicode.SpecialCase, s: $.Bytes): $.Bytes {
	// For now, ignore special case and fall back to regular ToUpper
	return ToUpper(s)
}

// ToLowerSpecial treats s as UTF-8-encoded bytes and returns a copy with all the Unicode letters mapped to their
// lower case, giving priority to the special casing rules.
export function ToLowerSpecial(c: unicode.SpecialCase, s: $.Bytes): $.Bytes {
	// For now, ignore special case and fall back to regular ToLower
	return ToLower(s)
}

// ToTitleSpecial treats s as UTF-8-encoded bytes and returns a copy with all the Unicode letters mapped to their
// title case, giving priority to the special casing rules.
export function ToTitleSpecial(c: unicode.SpecialCase, s: $.Bytes): $.Bytes {
	// For now, ignore special case and fall back to regular ToTitle
	return ToTitle(s)
}

// ToValidUTF8 treats s as UTF-8-encoded bytes and returns a copy with each run of bytes
// representing invalid UTF-8 replaced with the bytes in replacement, which may be empty.
export function ToValidUTF8(s: $.Bytes, replacement: $.Bytes): $.Bytes {
	if (s === null || $.len(s) === 0) {
		return s === null ? null : new Uint8Array(0)
	}
	
	const result: number[] = []
	const replacementArr = replacement ? $.bytesToArray(replacement) : []
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0 || r === utf8.RuneError) {
			// Invalid UTF-8, replace with replacement bytes
			for (const b of replacementArr) {
				result.push(b)
			}
			i++
		} else {
			for (let j = 0; j < size; j++) {
				result.push(s![i + j])
			}
			i += size
		}
	}
	
	return new Uint8Array(result)
}

// isSeparator reports whether the rune could mark a word boundary.
// TODO: update when package unicode captures more of the properties.
export function isSeparator(r: number): boolean {
	// ASCII alphanumerics and underscore are not separators
	if (r <= 0x7F) {
		if ((48 <= r && r <= 57) || // 0-9
			(97 <= r && r <= 122) || // a-z
			(65 <= r && r <= 90) ||  // A-Z
			r === 95) {              // _
			return false
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

// Title treats s as UTF-8-encoded bytes and returns a copy with all Unicode letters that begin
// words mapped to their title case.
//
// Deprecated: The rule Title uses for word boundaries does not handle Unicode
// punctuation properly. Use golang.org/x/text/cases instead.
export function Title(s: $.Bytes): $.Bytes {
	if (s === null || $.len(s) === 0) {
		return s === null ? null : new Uint8Array(0)
	}
	
	const result: number[] = []
	let prevIsSep = true  // Start of string counts as separator
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8, copy the byte as-is
			result.push(s![i])
			i++
			prevIsSep = true
		} else {
			let transformedR = r
			if (prevIsSep && unicode.IsLetter(r)) {
				transformedR = unicode.ToTitle(r)
			}
			
			// Encode the (possibly transformed) rune back to bytes
			const runeBytes = new Uint8Array(utf8.UTFMax)
			const n = utf8.EncodeRune(runeBytes, transformedR)
			
			// Add the encoded bytes to result
			for (let j = 0; j < n; j++) {
				result.push(runeBytes[j])
			}
			
			prevIsSep = isSeparator(r)
			i += size
		}
	}
	
	return new Uint8Array(result)
}

// TrimLeftFunc treats s as UTF-8-encoded bytes and returns a subslice of s by slicing off
// all leading UTF-8-encoded code points c that satisfy f(c).
export function TrimLeftFunc(s: $.Bytes, f: ((r: number) => boolean) | null): $.Bytes {
	const i = indexFunc(s, f, false)
	if (i === -1) {
		return null
	}
	return $.goSlice(s, i, undefined)
}

// TrimRightFunc returns a subslice of s by slicing off all trailing
// UTF-8-encoded code points c that satisfy f(c).
export function TrimRightFunc(s: $.Bytes, f: ((r: number) => boolean) | null): $.Bytes {
	const i = lastIndexFunc(s, f, false)
	if (i >= 0 && $.len(s) > i) {
		const [, wid] = utf8.DecodeRune($.goSlice(s, i, undefined))
		return $.goSlice(s, undefined, i + wid)
	}
	return null
}

// TrimFunc returns a subslice of s by slicing off all leading and trailing
// UTF-8-encoded code points c that satisfy f(c).
export function TrimFunc(s: $.Bytes, f: ((r: number) => boolean) | null): $.Bytes {
	return TrimRightFunc(TrimLeftFunc(s, f), f)
}

// TrimPrefix returns s without the provided leading prefix string.
// If s doesn't start with prefix, s is returned unchanged.
export function TrimPrefix(s: $.Bytes, prefix: $.Bytes): $.Bytes {
	if (HasPrefix(s, prefix)) {
		return $.goSlice(s, $.len(prefix), undefined)
	}
	return s
}

// TrimSuffix returns s without the provided trailing suffix string.
// If s doesn't end with suffix, s is returned unchanged.
export function TrimSuffix(s: $.Bytes, suffix: $.Bytes): $.Bytes {
	if (HasSuffix(s, suffix)) {
		return $.goSlice(s, undefined, $.len(s) - $.len(suffix))
	}
	return s
}

// IndexFunc interprets s as a sequence of UTF-8-encoded code points.
// It returns the byte index in s of the first Unicode
// code point satisfying f(c), or -1 if none do.
export function IndexFunc(s: $.Bytes, f: ((r: number) => boolean) | null): number {
	return indexFunc(s, f, true)
}

// LastIndexFunc interprets s as a sequence of UTF-8-encoded code points.
// It returns the byte index in s of the last Unicode
// code point satisfying f(c), or -1 if none do.
export function LastIndexFunc(s: $.Bytes, f: ((r: number) => boolean) | null): number {
	return lastIndexFunc(s, f, true)
}

// indexFunc is the same as IndexFunc except that if
// truth==false, the sense of the predicate function is
// inverted.
export function indexFunc(s: $.Bytes, f: ((r: number) => boolean) | null, truth: boolean): number {
	if (s === null || f === null) {
		return -1
	}
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8
			if (f(utf8.RuneError) === truth) {
				return i
			}
			i++
		} else {
			if (f(r) === truth) {
				return i
			}
			i += size
		}
	}
	
	return -1
}

// lastIndexFunc is the same as LastIndexFunc except that if
// truth==false, the sense of the predicate function is
// inverted.
export function lastIndexFunc(s: $.Bytes, f: ((r: number) => boolean) | null, truth: boolean): number {
	if (s === null || f === null) {
		return -1
	}
	
	let lastIndex = -1
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8
			if (f(utf8.RuneError) === truth) {
				lastIndex = i
			}
			i++
		} else {
			if (f(r) === truth) {
				lastIndex = i
			}
			i += size
		}
	}
	
	return lastIndex
}

class asciiSet {
	constructor(public _value: number[]) {}

	valueOf(): number[] {
		return this._value
	}

	toString(): string {
		return String(this._value)
	}

	static from(value: number[]): asciiSet {
		return new asciiSet(value)
	}

	// contains reports whether c is inside the set.
	public contains(c: number): boolean {
		const _as = this._value
		return ((_as![c >> 5] & (1 << (c & 31)))) !== 0
	}
}

// makeASCIISet creates a set of ASCII characters and reports whether all
// characters in chars are ASCII.
export function makeASCIISet(chars: string): [asciiSet, boolean] {
	const _as = new asciiSet([0, 0, 0, 0, 0, 0, 0, 0])
	
	for (let i = 0; i < chars.length; i++) {
		const c = chars.charCodeAt(i)
		if (c >= utf8.RuneSelf) {
			return [_as, false]
		}
		_as._value[c >> 5] |= (1 << (c & 31))
	}
	
	return [_as, true]
}

// containsRune is a simplified version of strings.ContainsRune
// to avoid importing the strings package.
// We avoid bytes.ContainsRune to avoid allocating a temporary copy of s.
export function containsRune(s: string, r: number): boolean {
	for (let i = 0; i < s.length; ) {
		const c = s.codePointAt(i)
		if (c === r) return true
		i += c! > 0xFFFF ? 2 : 1
	}
	return false
}

// Trim returns a subslice of s by slicing off all leading and
// trailing UTF-8-encoded code points contained in cutset.
export function Trim(s: $.Bytes, cutset: string): $.Bytes {
	if (s === null || cutset.length === 0) {
		return s
	}
	
	if (cutset.length === 1 && cutset.charCodeAt(0) < utf8.RuneSelf) {
		// Single ASCII character optimization
		return trimRightByte(trimLeftByte(s, cutset.charCodeAt(0)), cutset.charCodeAt(0))
	}
	
	const [as, allASCII] = makeASCIISet(cutset)
	if (allASCII) {
		return trimRightASCII(trimLeftASCII(s, as), as)
	}
	
	return trimRightUnicode(trimLeftUnicode(s, cutset), cutset)
}

// TrimLeft returns a subslice of s by slicing off all leading
// UTF-8-encoded code points contained in cutset.
export function TrimLeft(s: $.Bytes, cutset: string): $.Bytes {
	if (s === null || cutset.length === 0) {
		return s
	}
	
	if (cutset.length === 1 && cutset.charCodeAt(0) < utf8.RuneSelf) {
		// Single ASCII character optimization
		return trimLeftByte(s, cutset.charCodeAt(0))
	}
	
	const [as, allASCII] = makeASCIISet(cutset)
	if (allASCII) {
		return trimLeftASCII(s, as)
	}
	
	return trimLeftUnicode(s, cutset)
}

export function trimLeftByte(s: $.Bytes, c: number): $.Bytes {
	if (s === null) return null
	
	for (let i = 0; i < $.len(s); i++) {
		if (s![i] !== c) {
			return $.goSlice(s, i, undefined)
		}
	}
	
	return null
}

export function trimLeftASCII(s: $.Bytes, _as: asciiSet): $.Bytes {
	if (s === null) return null
	
	for (let i = 0; i < $.len(s); i++) {
		const b = s![i]
		if (b >= utf8.RuneSelf || !_as.contains(b)) {
			return $.goSlice(s, i, undefined)
		}
	}
	
	return null
}

export function trimLeftUnicode(s: $.Bytes, cutset: string): $.Bytes {
	if (s === null) return null
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8, keep it
			return $.goSlice(s, i, undefined)
		}
		
		if (!containsRune(cutset, r)) {
			return $.goSlice(s, i, undefined)
		}
		
		i += size
	}
	
	return null
}

// TrimRight returns a subslice of s by slicing off all trailing
// UTF-8-encoded code points that are contained in cutset.
export function TrimRight(s: $.Bytes, cutset: string): $.Bytes {
	if (s === null || cutset.length === 0) {
		return s
	}
	
	if (cutset.length === 1 && cutset.charCodeAt(0) < utf8.RuneSelf) {
		// Single ASCII character optimization
		return trimRightByte(s, cutset.charCodeAt(0))
	}
	
	const [as, allASCII] = makeASCIISet(cutset)
	if (allASCII) {
		return trimRightASCII(s, as)
	}
	
	return trimRightUnicode(s, cutset)
}

export function trimRightByte(s: $.Bytes, c: number): $.Bytes {
	if (s === null) return null
	
	for (let i = $.len(s) - 1; i >= 0; i--) {
		if (s![i] !== c) {
			return $.goSlice(s, undefined, i + 1)
		}
	}
	
	return null
}

export function trimRightASCII(s: $.Bytes, _as: asciiSet): $.Bytes {
	if (s === null) return null
	
	for (let i = $.len(s) - 1; i >= 0; i--) {
		const b = s![i]
		if (b >= utf8.RuneSelf || !_as.contains(b)) {
			return $.goSlice(s, undefined, i + 1)
		}
	}
	
	return null
}

export function trimRightUnicode(s: $.Bytes, cutset: string): $.Bytes {
	if (s === null) return null
	
	// Need to scan from left to find rune boundaries, but track the last non-cutset position
	let lastKeep = -1
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8, keep everything up to here
			return $.goSlice(s, undefined, i + 1)
		}
		
		if (!containsRune(cutset, r)) {
			lastKeep = i + size
		}
		
		i += size
	}
	
	if (lastKeep < 0) {
		return null
	}
	
	return $.goSlice(s, undefined, lastKeep)
}

// TrimSpace returns a subslice of s by slicing off all leading and
// trailing white space, as defined by Unicode.
export function TrimSpace(s: $.Bytes): $.Bytes {
	return TrimFunc(s, unicode.IsSpace)
}

// Runes interprets s as a sequence of UTF-8-encoded code points.
// It returns a slice of runes (Unicode code points) equivalent to s.
export function Runes(s: $.Bytes): $.Slice<number> {
	if (s === null || $.len(s) === 0) {
		return null
	}
	
	const result: number[] = []
	
	for (let i = 0; i < $.len(s); ) {
		const [r, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
		if (size <= 0) {
			// Invalid UTF-8, add replacement character
			result.push(utf8.RuneError)
			i++
		} else {
			result.push(r)
			i += size
		}
	}
	
	return $.arrayToSlice(result)
}

// Replace returns a copy of the slice s with the first n
// non-overlapping instances of old replaced by new.
// If old is empty, it matches at the beginning of the slice
// and after each UTF-8 sequence, yielding up to k+1 replacements
// for a k-rune slice.
// If n < 0, there is no limit on the number of replacements.
export function Replace(s: $.Bytes, old: $.Bytes, _new: $.Bytes, n: number): $.Bytes {
	if (s === null) {
		return new Uint8Array(0)
	}
	
	if (n === 0) {
		// Make a copy without any replacements
		return new Uint8Array($.bytesToArray(s))
	}
	
	// Handle empty old pattern - replace at beginning and after each UTF-8 sequence
	if (old === null || $.len(old) === 0) {
		const result: number[] = []
		const newBytes = _new === null ? [] : $.bytesToArray(_new)
		
		// Add replacement at beginning
		if (n !== 0) {
			result.push(...newBytes)
			if (n > 0) n--
		}
		
		// Add replacement after each UTF-8 sequence
		for (let i = 0; i < $.len(s) && n !== 0; ) {
			const [, size] = utf8.DecodeRune($.goSlice(s, i, undefined))
			if (size <= 0) {
				result.push(s![i])
				i++
			} else {
				// Add the rune bytes
				for (let j = 0; j < size; j++) {
					result.push(s![i + j])
				}
				i += size
			}
			
			// Add replacement after this rune
			if (n !== 0) {
				result.push(...newBytes)
				if (n > 0) n--
			}
		}
		
		return new Uint8Array(result)
	}
	
	// Normal case - replace occurrences of old with new
	const result: number[] = []
	const sBytes = $.bytesToArray(s)
	const oldBytes = $.bytesToArray(old)
	const newBytes = _new === null ? [] : $.bytesToArray(_new)
	
	let i = 0
	let replacements = 0
	
	while (i <= sBytes.length - oldBytes.length && (n < 0 || replacements < n)) {
		// Check if old pattern matches at current position
		let matches = true
		for (let j = 0; j < oldBytes.length; j++) {
			if (sBytes[i + j] !== oldBytes[j]) {
				matches = false
				break
			}
		}
		
		if (matches) {
			// Replace with new bytes
			result.push(...newBytes)
			i += oldBytes.length
			replacements++
		} else {
			// Copy one byte and advance
			result.push(sBytes[i])
			i++
		}
	}
	
	// Copy remaining bytes
	while (i < sBytes.length) {
		result.push(sBytes[i])
		i++
	}
	
	return new Uint8Array(result)
}

// ReplaceAll returns a copy of the slice s with all
// non-overlapping instances of old replaced by new.
// If old is empty, it matches at the beginning of the slice
// and after each UTF-8 sequence, yielding up to k+1 replacements
// for a k-rune slice.
export function ReplaceAll(s: $.Bytes, old: $.Bytes, _new: $.Bytes): $.Bytes {
	return Replace(s, old, _new, -1)
}

// EqualFold reports whether s and t, interpreted as UTF-8 strings,
// are equal under simple Unicode case-folding, which is a more general
// form of case-insensitivity.
export function EqualFold(s: $.Bytes, t: $.Bytes): boolean {
	if (s === null && t === null) return true
	if (s === null || t === null) return false
	
	let si = 0, ti = 0
	
	while (si < $.len(s) && ti < $.len(t)) {
		const [sr, ssize] = utf8.DecodeRune($.goSlice(s, si, undefined))
		const [tr, tsize] = utf8.DecodeRune($.goSlice(t, ti, undefined))
		
		if (ssize <= 0 || tsize <= 0) {
			// Invalid UTF-8, fall back to byte comparison
			if (s![si] !== t![ti]) return false
			si++
			ti++
		} else {
			// Convert both to lowercase for comparison
			const sLower = unicode.ToLower(sr)
			const tLower = unicode.ToLower(tr)
			
			if (sLower !== tLower) return false
			
			si += ssize
			ti += tsize
		}
	}
	
	return si === $.len(s) && ti === $.len(t)
}

// Index returns the index of the first instance of sep in s, or -1 if sep is not present in s.
export function Index(s: $.Bytes, sep: $.Bytes): number {
	return $.bytesIndexOf(s, sep)
}

// Cut slices s around the first instance of sep,
// returning the text before and after sep.
// The found result reports whether sep appears in s.
// If sep does not appear in s, cut returns s, nil, false.
//
// Cut returns slices of the original slice s, not copies.
export function Cut(s: $.Bytes, sep: $.Bytes): [$.Bytes, $.Bytes, boolean] {
	const i = Index(s, sep)
	if (i >= 0) {
		return [$.goSlice(s, undefined, i), $.goSlice(s, i + $.len(sep), undefined), true]
	}
	return [s, null, false]
}

// Clone returns a copy of b[:len(b)].
// The result may have additional unused capacity.
// Clone(nil) returns nil.
export function Clone(b: $.Bytes): $.Bytes {
	if (b === null) {
		return null
	}
	return new Uint8Array($.bytesToArray(b))
}

// CutPrefix returns s without the provided leading prefix byte slice
// and reports whether it found the prefix.
// If s doesn't start with prefix, CutPrefix returns s, false.
// If prefix is the empty byte slice, CutPrefix returns s, true.
//
// CutPrefix returns slices of the original slice s, not copies.
export function CutPrefix(s: $.Bytes, prefix: $.Bytes): [$.Bytes, boolean] {
	if (!HasPrefix(s, prefix)) {
		return [s, false]
	}
	return [$.goSlice(s, $.len(prefix), undefined), true]
}

// CutSuffix returns s without the provided ending suffix byte slice
// and reports whether it found the suffix.
// If s doesn't end with suffix, CutSuffix returns s, false.
// If suffix is the empty byte slice, CutSuffix returns s, true.
//
// CutSuffix returns slices of the original slice s, not copies.
export function CutSuffix(s: $.Bytes, suffix: $.Bytes): [$.Bytes, boolean] {
	if (!HasSuffix(s, suffix)) {
		return [s, false]
	}
	return [$.goSlice(s, undefined, $.len(s) - $.len(suffix)), true]
}

