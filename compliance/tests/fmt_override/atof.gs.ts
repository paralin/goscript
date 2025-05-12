// Generated file based on atof.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

import * as math from "@goscript/math"

// set to false to force slow-path conversions for testing
let optimize: boolean = true

// commonPrefixLenIgnoreCase returns the length of the common
// prefix of s and prefix, with the character case of s ignored.
// The prefix argument must be all lower-case.
function commonPrefixLenIgnoreCase(sprefix: string): number {
	let n = $.len(prefix)
	if (n > $.len(s)) {
		n = $.len(s)
	}
	for (let i = 0; i < n; i++) {
		let c = s![i]
		if (65 <= c && c <= 90) {
			c += 97 - 65
		}
		if (c != prefix![i]) {
			return i
		}
	}
	return n
}

// special returns the floating-point value for the special,
// possibly signed floating-point representations inf, infinity,
// and NaN. The result is ok if a prefix of s contains one
// of these representations and n is the length of that prefix.
// The character case is ignored.
function special(s: string): [number, number, boolean] {
	if ($.len(s) == 0) {
		return [0, 0, false]
	}
	let sign = 1
	let nsign = 0

	// Anything longer than "inf" is ok, but if we
	// don't have "infinity", only consume "inf".
	switch (s![0]) {
		case 43, 45:
			if (s![0] == 45) {
				sign = -1
			}
			nsign = 1
			s = $.goSlice(s, 1, undefined)
			// unhandled branch statement token: fallthrough
			break
		case 105, 73:
			let n = commonPrefixLenIgnoreCase(s, "infinity")
			if (3 < n && n < 8) {
				n = 3
			}
			if (n == 3 || n == 8) {
				return [math.Inf(sign), nsign + n, true]
			}
			break
		case 110, 78:
			if (commonPrefixLenIgnoreCase(s, "nan") == 3) {
				return [math.NaN(), 3, true]
			}
			break
	}
	return [0, 0, false]
}

// readFloat reads a decimal or hexadecimal mantissa and exponent from a float
// string representation in s; the number may be followed by other characters.
// readFloat reports the number of bytes consumed (i), and whether the number
// is valid (ok).
function readFloat(s: string): [bigint, number, boolean, number, boolean] {
	let underscores = false

	// optional sign
	if (i >= $.len(s)) {
		return 
	}
	switch (true) {
		case s![i] == 43:
			i++
			break
		case s![i] == 45:
			neg = true
			i++
			break
	}

	// digits
	let base = uint64(10)
	let maxMantDigits = 19
	let expChar = $.byte(101)

	// 16^16 fits in uint64
	if (i + 2 < $.len(s) && s![i] == 48 && lower(s![i + 1]) == 120) {
		base = 16
		maxMantDigits = 16
		i += 2
		expChar = 112
		hex = true
	}
	let sawdot = false
	let sawdigits = false
	let nd = 0
	let ndMant = 0
	let dp = 0

	// ignore leading zeros
