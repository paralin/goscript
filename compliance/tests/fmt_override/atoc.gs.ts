// Generated file based on atoc.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

import * as stringslite from "@goscript/internal/stringslite"

let fnParseComplex: string = "ParseComplex"

// convErr splits an error returned by parseFloatPrefix
// into a syntax or range error for ParseComplex.
function convErr(err: $.Error, s: string): [$.Error] {
	{let { value: x, ok: ok } = $.typeAssert<$.Box<NumError> | null>(err, 'unknown')
		if (ok) {
			x.Func = fnParseComplex
			x.Num = stringslite.Clone(s)
			if (x.Err == ErrRange) {
				return [null, x]
			}
		}
	}return [err, null]
}

// ParseComplex converts the string s to a complex number
// with the precision specified by bitSize: 64 for complex64, or 128 for complex128.
// When bitSize=64, the result still has type complex128, but it will be
// convertible to complex64 without changing its value.
//
// The number represented by s must be of the form N, Ni, or N±Ni, where N stands
// for a floating-point number as recognized by [ParseFloat], and i is the imaginary
// component. If the second N is unsigned, a + sign is required between the two components
// as indicated by the ±. If the second N is NaN, only a + sign is accepted.
// The form may be parenthesized and cannot contain any spaces.
// The resulting complex number consists of the two components converted by ParseFloat.
//
// The errors that ParseComplex returns have concrete type [*NumError]
// and include err.Num = s.
//
// If s is not syntactically well-formed, ParseComplex returns err.Err = ErrSyntax.
//
// If s is syntactically well-formed but either component is more than 1/2 ULP
// away from the largest floating point number of the given component's size,
// ParseComplex returns err.Err = ErrRange and c = ±Inf for the respective component.
export function ParseComplex(s: string, bitSize: number): [complex128, $.Error] {
	let size = 64

	// complex64 uses float32 parts
	if (bitSize == 64) {
		size = 32
	}

	let orig = s

	// Remove parentheses, if any.
	if ($.len(s) >= 2 && s![0] == 40 && s![$.len(s) - 1] == 41) {
		s = $.goSlice(s, 1, $.len(s) - 1)
	}

	// pending range error, or nil
	let pending: $.Error = null

	// Read real part (possibly imaginary part if followed by 'i').
	let [re, n, err] = parseFloatPrefix(s, size)
	if (err != null) {
		[err, pending] = convErr(err, orig)
		if (err != null) {
			return [0, err]
		}
	}
	s = $.goSlice(s, n, undefined)

	// If we have nothing left, we're done.
	if ($.len(s) == 0) {
		return [complex(re, 0), pending]
	}

	// Otherwise, look at the next character.

	// Consume the '+' to avoid an error if we have "+NaNi", but
	// do this only if we don't have a "++" (don't hide that error).

	// ok

	// If 'i' is the last character, we only have an imaginary part.
	switch (s![0]) {
		case 43:
			if ($.len(s) > 1 && s![1] != 43) {
				s = $.goSlice(s, 1, undefined)
			}
			break
		case 45:
			break
		case 105:
			if ($.len(s) == 1) {
				return [complex(0, re), pending]
			}
			// unhandled branch statement token: fallthrough
			break
		default:
			return [0, syntaxError(fnParseComplex, orig)]
			break
	}

	// Read imaginary part.
	let im: number
	[im, n, err] = parseFloatPrefix(s, size)
	if (err != null) {
		[err, pending] = convErr(err, orig)
		if (err != null) {
			return [0, err]
		}
	}
	s = $.goSlice(s, n, undefined)
	if (s != "i") {
		return [0, syntaxError(fnParseComplex, orig)]
	}
	return [complex(re, im), pending]
}

