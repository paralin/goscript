import * as $ from "@goscript/builtin/builtin.js";

// the "error" Rune or "Unicode replacement character"
export let RuneError: number = 65533

// characters below RuneSelf are represented as themselves in a single byte.
export let RuneSelf: number = 0x80

// Maximum valid Unicode code point.
export let MaxRune: number = 1114111

// maximum number of bytes of a UTF-8 encoded Unicode character.
export let UTFMax: number = 4

let surrogateMin: number = 0xD800

let surrogateMax: number = 0xDFFF

let t1: number = 0b00000000

let tx: number = 0b10000000

let t2: number = 0b11000000

let t3: number = 0b11100000

let t4: number = 0b11110000

let t5: number = 0b11111000

let maskx: number = 0b00111111

let mask2: number = 0b00011111

let mask3: number = 0b00001111

let mask4: number = 0b00000111

let rune1Max: number = (1 << 7) - 1

let rune2Max: number = (1 << 11) - 1

let rune3Max: number = (1 << 16) - 1

// The default lowest and highest continuation byte.
let locb: number = 0b10000000

let hicb: number = 0b10111111

// These names of these constants are chosen to give nice alignment in the
// table below. The first nibble is an index into acceptRanges or F for
// special one-byte cases. The second nibble is the Rune length or the
// Status for the special one-byte case.
// invalid: size 1
let xx: number = 0xF1

// ASCII: size 1
let as: number = 0xF0

// accept 0, size 2
let s1: number = 0x02

// accept 1, size 3
let s2: number = 0x13

// accept 0, size 3
let s3: number = 0x03

// accept 2, size 3
let s4: number = 0x23

// accept 3, size 4
let s5: number = 0x34

// accept 0, size 4
let s6: number = 0x04

// accept 4, size 4
let s7: number = 0x44

let runeErrorByte0: number = (224 | ((65533 >> 12)))

let runeErrorByte1: number = (128 | (((65533 >> 6)) & 63))

let runeErrorByte2: number = (128 | (65533 & 63))

let first = $.arrayToSlice<number>([240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 240, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 19, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 35, 3, 3, 52, 4, 4, 4, 68, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241, 241])

class acceptRange {
	// lowest value for second byte.
	public get lo(): number {
		return this._fields.lo.value
	}
	public set lo(value: number) {
		this._fields.lo.value = value
	}

	// highest value for second byte.
	public get hi(): number {
		return this._fields.hi.value
	}
	public set hi(value: number) {
		this._fields.hi.value = value
	}

	public _fields: {
		lo: $.VarRef<number>;
		hi: $.VarRef<number>;
	}

	constructor(init?: Partial<{hi?: number, lo?: number}>) {
		this._fields = {
			lo: $.varRef(init?.lo ?? 0),
			hi: $.varRef(init?.hi ?? 0)
		}
	}

	public clone(): acceptRange {
		const cloned = new acceptRange()
		cloned._fields = {
			lo: $.varRef(this._fields.lo.value),
			hi: $.varRef(this._fields.hi.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'acceptRange',
	  new acceptRange(),
	  [],
	  acceptRange,
	  {"lo": { kind: $.TypeKind.Basic, name: "number" }, "hi": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

let acceptRanges = $.arrayToSlice<acceptRange>([{hi: 191, lo: 128}, {hi: 191, lo: 0xA0}, {hi: 0x9F, lo: 128}, {hi: 191, lo: 0x90}, {hi: 0x8F, lo: 128}, new acceptRange(), new acceptRange(), new acceptRange(), new acceptRange(), new acceptRange(), new acceptRange(), new acceptRange(), new acceptRange(), new acceptRange(), new acceptRange(), new acceptRange()])

// FullRune reports whether the bytes in p begin with a full UTF-8 encoding of a rune.
// An invalid encoding is considered a full Rune since it will convert as a width-1 error rune.
export function FullRune(p: Uint8Array): boolean {
	let n = $.len(p)
	if (n == 0) {
		return false
	}
	let x = first![p![0]]

	// ASCII, invalid or valid.
	if (n >= ((x & 7) as number)) {
		return true
	}
	// Must be short or invalid.
	let accept = acceptRanges![(x >> 4)].clone()
	if (n > 1 && (p![1] < accept.lo || accept.hi < p![1])) {
		return true
	} else if (n > 2 && (p![2] < 128 || 191 < p![2])) {
		return true
	}
	return false
}

// FullRuneInString is like FullRune but its input is a string.
export function FullRuneInString(s: string): boolean {
	let n = $.len(s)
	if (n == 0) {
		return false
	}
	let x = first![$.indexString(s, 0)]

	// ASCII, invalid, or valid.
	if (n >= ((x & 7) as number)) {
		return true
	}
	// Must be short or invalid.
	let accept = acceptRanges![(x >> 4)].clone()
	if (n > 1 && ($.indexString(s, 1) < accept.lo || accept.hi < $.indexString(s, 1))) {
		return true
	} else if (n > 2 && ($.indexString(s, 2) < 128 || 191 < $.indexString(s, 2))) {
		return true
	}
	return false
}

// DecodeRune unpacks the first UTF-8 encoding in p and returns the rune and
// its width in bytes. If p is empty it returns ([RuneError], 0). Otherwise, if
// the encoding is invalid, it returns (RuneError, 1). Both are impossible
// results for correct, non-empty UTF-8.
//
// An encoding is invalid if it is incorrect UTF-8, encodes a rune that is
// out of range, or is not the shortest possible UTF-8 encoding for the
// value. No other validation is performed.
export function DecodeRune(p: Uint8Array): [number, number] {
	let r: number = 0
	let size: number = 0
	{
		let n = $.len(p)
		if (n < 1) {
			return [65533, 0]
		}
		let p0 = p![0]
		let x = first![p0]

		// The following code simulates an additional check for x == xx and
		// handling the ASCII and invalid cases accordingly. This mask-and-or
		// approach prevents an additional branch.
		// Create 0x0000 or 0xFFFF.
		if (x >= 240) {
			// The following code simulates an additional check for x == xx and
			// handling the ASCII and invalid cases accordingly. This mask-and-or
			// approach prevents an additional branch.
			let mask = (((x as number) << 31) >> 31) // Create 0x0000 or 0xFFFF.
			return [(((p![0] as number) & ~ mask) | (65533 & mask)), 1]
		}
		let sz = ((x & 7) as number)
		let accept = acceptRanges![(x >> 4)].clone()
		if (n < sz) {
			return [65533, 1]
		}
		let b1 = p![1]
		if (b1 < accept.lo || accept.hi < b1) {
			return [65533, 1]
		}
		// <= instead of == to help the compiler eliminate some bounds checks
		if (sz <= 2) {
			// <= instead of == to help the compiler eliminate some bounds checks
			return [((((p0 & 31) as number) << 6) | ((b1 & 63) as number)), 2]
		}
		let b2 = p![2]
		if (b2 < 128 || 191 < b2) {
			return [65533, 1]
		}
		if (sz <= 3) {
			return [(((((p0 & 15) as number) << 12) | (((b1 & 63) as number) << 6)) | ((b2 & 63) as number)), 3]
		}
		let b3 = p![3]
		if (b3 < 128 || 191 < b3) {
			return [65533, 1]
		}
		return [((((((p0 & 7) as number) << 18) | (((b1 & 63) as number) << 12)) | (((b2 & 63) as number) << 6)) | ((b3 & 63) as number)), 4]
	}
}

// DecodeRuneInString is like [DecodeRune] but its input is a string. If s is
// empty it returns ([RuneError], 0). Otherwise, if the encoding is invalid, it
// returns (RuneError, 1). Both are impossible results for correct, non-empty
// UTF-8.
//
// An encoding is invalid if it is incorrect UTF-8, encodes a rune that is
// out of range, or is not the shortest possible UTF-8 encoding for the
// value. No other validation is performed.
export function DecodeRuneInString(s: string): [number, number] {
	let r: number = 0
	let size: number = 0
	{
		let n = $.len(s)
		if (n < 1) {
			return [65533, 0]
		}
		let s0 = $.indexString(s, 0)
		let x = first![s0]

		// The following code simulates an additional check for x == xx and
		// handling the ASCII and invalid cases accordingly. This mask-and-or
		// approach prevents an additional branch.
		// Create 0x0000 or 0xFFFF.
		if (x >= 240) {
			// The following code simulates an additional check for x == xx and
			// handling the ASCII and invalid cases accordingly. This mask-and-or
			// approach prevents an additional branch.
			let mask = (((x as number) << 31) >> 31) // Create 0x0000 or 0xFFFF.
			return [((($.indexString(s, 0) as number) & ~ mask) | (65533 & mask)), 1]
		}
		let sz = ((x & 7) as number)
		let accept = acceptRanges![(x >> 4)].clone()
		if (n < sz) {
			return [65533, 1]
		}
		let s1 = $.indexString(s, 1)
		if (s1 < accept.lo || accept.hi < s1) {
			return [65533, 1]
		}
		// <= instead of == to help the compiler eliminate some bounds checks
		if (sz <= 2) {
			// <= instead of == to help the compiler eliminate some bounds checks
			return [((((s0 & 31) as number) << 6) | ((s1 & 63) as number)), 2]
		}
		let s2 = $.indexString(s, 2)
		if (s2 < 128 || 191 < s2) {
			return [65533, 1]
		}
		if (sz <= 3) {
			return [(((((s0 & 15) as number) << 12) | (((s1 & 63) as number) << 6)) | ((s2 & 63) as number)), 3]
		}
		let s3 = $.indexString(s, 3)
		if (s3 < 128 || 191 < s3) {
			return [65533, 1]
		}
		return [((((((s0 & 7) as number) << 18) | (((s1 & 63) as number) << 12)) | (((s2 & 63) as number) << 6)) | ((s3 & 63) as number)), 4]
	}
}

// DecodeLastRune unpacks the last UTF-8 encoding in p and returns the rune and
// its width in bytes. If p is empty it returns ([RuneError], 0). Otherwise, if
// the encoding is invalid, it returns (RuneError, 1). Both are impossible
// results for correct, non-empty UTF-8.
//
// An encoding is invalid if it is incorrect UTF-8, encodes a rune that is
// out of range, or is not the shortest possible UTF-8 encoding for the
// value. No other validation is performed.
export function DecodeLastRune(p: Uint8Array): [number, number] {
	let r: number = 0
	let size: number = 0
	{
		let end = $.len(p)
		if (end == 0) {
			return [65533, 0]
		}
		let start = end - 1
		r = (p![start] as number)
		if (r < 128) {
			return [r, 1]
		}
		// guard against O(n^2) behavior when traversing
		// backwards through strings with long sequences of
		// invalid UTF-8.
		let lim = end - 4
		if (lim < 0) {
			lim = 0
		}
		for (start--; start >= lim; start--) {
			if (RuneStart(p![start])) {
				break
			}
		}
		if (start < 0) {
			start = 0
		}
		[r, size] = DecodeRune(p.subarray(start, end))
		if (start + size != end) {
			return [65533, 1]
		}
		return [r, size]
	}
}

// DecodeLastRuneInString is like [DecodeLastRune] but its input is a string. If
// s is empty it returns ([RuneError], 0). Otherwise, if the encoding is invalid,
// it returns (RuneError, 1). Both are impossible results for correct,
// non-empty UTF-8.
//
// An encoding is invalid if it is incorrect UTF-8, encodes a rune that is
// out of range, or is not the shortest possible UTF-8 encoding for the
// value. No other validation is performed.
export function DecodeLastRuneInString(s: string): [number, number] {
	let r: number = 0
	let size: number = 0
	{
		let end = $.len(s)
		if (end == 0) {
			return [65533, 0]
		}
		let start = end - 1
		r = ($.indexString(s, start) as number)
		if (r < 128) {
			return [r, 1]
		}
		// guard against O(n^2) behavior when traversing
		// backwards through strings with long sequences of
		// invalid UTF-8.
		let lim = end - 4
		if (lim < 0) {
			lim = 0
		}
		for (start--; start >= lim; start--) {
			if (RuneStart($.indexString(s, start))) {
				break
			}
		}
		if (start < 0) {
			start = 0
		}
		[r, size] = DecodeRuneInString($.sliceString(s, start, end))
		if (start + size != end) {
			return [65533, 1]
		}
		return [r, size]
	}
}

// RuneLen returns the number of bytes in the UTF-8 encoding of the rune.
// It returns -1 if the rune is not a valid value to encode in UTF-8.
export function RuneLen(r: number): number {
	switch (true) {
		case r < 0:
			return -1
			break
		case r <= 127:
			return 1
			break
		case r <= 2047:
			return 2
			break
		case 55296 <= r && r <= 57343:
			return -1
			break
		case r <= 65535:
			return 3
			break
		case r <= 1114111:
			return 4
			break
	}
	return -1
}

// EncodeRune writes into p (which must be large enough) the UTF-8 encoding of the rune.
// If the rune is out of range, it writes the encoding of [RuneError].
// It returns the number of bytes written.
export function EncodeRune(p: Uint8Array, r: number): number {
	// This function is inlineable for fast handling of ASCII.
	if ((r as number) <= 127) {
		p![0] = $.byte(r)
		return 1
	}
	return encodeRuneNonASCII(p, r)
}

export function encodeRuneNonASCII(p: Uint8Array, r: number): number {
	// Negative values are erroneous. Making it unsigned addresses the problem.

	// eliminate bounds checks

	// eliminate bounds checks

	// eliminate bounds checks

	// eliminate bounds checks
	{let i = (r as number)
		switch (true) {
			case i <= 2047:
				/* _ = */ p![1] // eliminate bounds checks
				p![0] = (192 | $.byte((r >> 6)))
				p![1] = (128 | ($.byte(r) & 63))
				return 2
				break
			case i < 55296:
			case 57343 < i && i <= 65535:
				/* _ = */ p![2] // eliminate bounds checks
				p![0] = (224 | $.byte((r >> 12)))
				p![1] = (128 | ($.byte((r >> 6)) & 63))
				p![2] = (128 | ($.byte(r) & 63))
				return 3
				break
			case i > 65535 && i <= 1114111:
				/* _ = */ p![3] // eliminate bounds checks
				p![0] = (240 | $.byte((r >> 18)))
				p![1] = (128 | ($.byte((r >> 12)) & 63))
				p![2] = (128 | ($.byte((r >> 6)) & 63))
				p![3] = (128 | ($.byte(r) & 63))
				return 4
				break
			default:
				/* _ = */ p![2] // eliminate bounds checks
				p![0] = 239
				p![1] = 191
				p![2] = 189
				return 3
				break
		}
	}}

// AppendRune appends the UTF-8 encoding of r to the end of p and
// returns the extended buffer. If the rune is out of range,
// it appends the encoding of [RuneError].
export function AppendRune(p: Uint8Array, r: number): Uint8Array {
	// This function is inlineable for fast handling of ASCII.
	if ((r as number) <= 127) {
		return $.append(p, $.byte(r))
	}
	return appendRuneNonASCII(p, r)
}

export function appendRuneNonASCII(p: Uint8Array, r: number): Uint8Array {
	// Negative values are erroneous. Making it unsigned addresses the problem.
	{let i = (r as number)
		switch (true) {
			case i <= 2047:
				return $.append(p, (192 | $.byte((r >> 6))), (128 | ($.byte(r) & 63)))
				break
			case i < 55296:
			case 57343 < i && i <= 65535:
				return $.append(p, (224 | $.byte((r >> 12))), (128 | ($.byte((r >> 6)) & 63)), (128 | ($.byte(r) & 63)))
				break
			case i > 65535 && i <= 1114111:
				return $.append(p, (240 | $.byte((r >> 18))), (128 | ($.byte((r >> 12)) & 63)), (128 | ($.byte((r >> 6)) & 63)), (128 | ($.byte(r) & 63)))
				break
			default:
				return $.append(p, 239, 191, 189)
				break
		}
	}}

// RuneCount returns the number of runes in p. Erroneous and short
// encodings are treated as single runes of width 1 byte.
export function RuneCount(p: Uint8Array): number {
	let np = $.len(p)
	let n: number = 0

	// non-ASCII slow path
	for (; n < np; n++) {

		// non-ASCII slow path
		{
			let c = p![n]
			if (c >= 128) {
				// non-ASCII slow path
				return n + RuneCountInString($.bytesToString(p.subarray(n)))
			}
		}
	}
	return n
}

// RuneCountInString is like [RuneCount] but its input is a string.
export function RuneCountInString(s: string): [number] {
	let n: number = 0
	{
		{
			const _runes = $.stringToRunes(s)
			for (let i = 0; i < _runes.length; i++) {
				{
					n++
				}
			}
		}
		return n
	}
}

// RuneStart reports whether the byte could be the first byte of an encoded,
// possibly invalid rune. Second and subsequent bytes always have the top two
// bits set to 10.
export function RuneStart(b: number): boolean {
	return (b & 0xC0) != 0x80
}

// Valid reports whether p consists entirely of valid UTF-8-encoded runes.
export function Valid(p: Uint8Array): boolean {
	// This optimization avoids the need to recompute the capacity
	// when generating code for p[8:], bringing it to parity with
	// ValidString, which was 20% faster on long ASCII strings.
	p = $.goSlice(p, undefined, $.len(p), $.len(p))

	// Fast path. Check for and skip 8 bytes of ASCII characters per iteration.

	// Combining two 32 bit loads allows the same code to be used
	// for 32 and 64 bit platforms.
	// The compiler can generate a 32bit load for first32 and second32
	// on many platforms. See test/codegen/memcombine.go.

	// Found a non ASCII byte (>= RuneSelf).
	for (; $.len(p) >= 8; ) {
		// Combining two 32 bit loads allows the same code to be used
		// for 32 and 64 bit platforms.
		// The compiler can generate a 32bit load for first32 and second32
		// on many platforms. See test/codegen/memcombine.go.
		let first32 = ((((p![0] as number) | ((p![1] as number) << 8)) | ((p![2] as number) << 16)) | ((p![3] as number) << 24))
		let second32 = ((((p![4] as number) | ((p![5] as number) << 8)) | ((p![6] as number) << 16)) | ((p![7] as number) << 24))

		// Found a non ASCII byte (>= RuneSelf).
		if ((((first32 | second32)) & 0x80808080) != 0) {
			// Found a non ASCII byte (>= RuneSelf).
			break
		}
		p = p.subarray(8)
	}
	let n = $.len(p)

	// Illegal starter byte.

	// Short or invalid.
	for (let i = 0; i < n; ) {
		let pi = p![i]
		if (pi < 128) {
			i++
			continue
		}
		let x = first![pi]

		// Illegal starter byte.
		if (x == 241) {
			return false
		}
		let size = ((x & 7) as number)

		// Short or invalid.
		if (i + size > n) {
			return false
		}
		let accept = acceptRanges![(x >> 4)].clone()
		{
			let c = p![i + 1]
			if (c < accept.lo || accept.hi < c) {
				return false
			} else if (size == 2) {
			} else {
				let c = p![i + 2]
				if (c < 128 || 191 < c) {
					return false
				} else if (size == 3) {
				} else {
					let c = p![i + 3]
					if (c < 128 || 191 < c) {
						return false
					}
				}
			}
		}
		i += size
	}
	return true
}

// ValidString reports whether s consists entirely of valid UTF-8-encoded runes.
export function ValidString(s: string): boolean {
	// Fast path. Check for and skip 8 bytes of ASCII characters per iteration.

	// Combining two 32 bit loads allows the same code to be used
	// for 32 and 64 bit platforms.
	// The compiler can generate a 32bit load for first32 and second32
	// on many platforms. See test/codegen/memcombine.go.

	// Found a non ASCII byte (>= RuneSelf).
	for (; $.len(s) >= 8; ) {
		// Combining two 32 bit loads allows the same code to be used
		// for 32 and 64 bit platforms.
		// The compiler can generate a 32bit load for first32 and second32
		// on many platforms. See test/codegen/memcombine.go.
		let first32 = (((($.indexString(s, 0) as number) | (($.indexString(s, 1) as number) << 8)) | (($.indexString(s, 2) as number) << 16)) | (($.indexString(s, 3) as number) << 24))
		let second32 = (((($.indexString(s, 4) as number) | (($.indexString(s, 5) as number) << 8)) | (($.indexString(s, 6) as number) << 16)) | (($.indexString(s, 7) as number) << 24))

		// Found a non ASCII byte (>= RuneSelf).
		if ((((first32 | second32)) & 0x80808080) != 0) {
			// Found a non ASCII byte (>= RuneSelf).
			break
		}
		s = $.sliceString(s, 8, undefined)
	}
	let n = $.len(s)

	// Illegal starter byte.

	// Short or invalid.
	for (let i = 0; i < n; ) {
		let si = $.indexString(s, i)
		if (si < 128) {
			i++
			continue
		}
		let x = first![si]

		// Illegal starter byte.
		if (x == 241) {
			return false
		}
		let size = ((x & 7) as number)

		// Short or invalid.
		if (i + size > n) {
			return false
		}
		let accept = acceptRanges![(x >> 4)].clone()
		{
			let c = $.indexString(s, i + 1)
			if (c < accept.lo || accept.hi < c) {
				return false
			} else if (size == 2) {
			} else {
				let c = $.indexString(s, i + 2)
				if (c < 128 || 191 < c) {
					return false
				} else if (size == 3) {
				} else {
					let c = $.indexString(s, i + 3)
					if (c < 128 || 191 < c) {
						return false
					}
				}
			}
		}
		i += size
	}
	return true
}

// ValidRune reports whether r can be legally encoded as UTF-8.
// Code points that are out of range or a surrogate half are illegal.
export function ValidRune(r: number): boolean {
	switch (true) {
		case 0 <= r && r < 55296:
			return true
			break
		case 57343 < r && r <= 1114111:
			return true
			break
	}
	return false
}

