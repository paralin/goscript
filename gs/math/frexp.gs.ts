import * as $ from "@goscript/builtin/builtin.js";
import { IsInf, IsNaN, normalize } from "./bits.gs.js";

import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Frexp breaks f into a normalized fraction
// and an integral power of two.
// It returns frac and exp satisfying f == frac × 2**exp,
// with the absolute value of frac in the interval [½, 1).
//
// Special cases are:
//
//	Frexp(±0) = ±0, 0
//	Frexp(±Inf) = ±Inf, 0
//	Frexp(NaN) = NaN, 0
export function Frexp(f: number): [number, number] {
	return frexp(f)
}

export function frexp(f: number): [number, number] {
	// Handle special cases
	if (f === 0) {
		return [f, 0] // Preserve sign of zero
	}
	
	if (!Number.isFinite(f) || Number.isNaN(f)) {
		return [f, 0]
	}
	
	// For normal numbers, extract exponent and mantissa
	const absF = Math.abs(f)
	const exp = Math.floor(Math.log2(absF)) + 1
	const frac = f / Math.pow(2, exp)
	
	return [frac, exp]
}

