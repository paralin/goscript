import * as $ from "@goscript/builtin/builtin.js";
import { Inf, IsInf, IsNaN, normalize } from "./bits.gs.js";
import { Copysign } from "./copysign.gs.js";

import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Ldexp is the inverse of [Frexp].
// It returns frac × 2**exp.
//
// Special cases are:
//
//	Ldexp(±0, exp) = ±0
//	Ldexp(±Inf, exp) = ±Inf
//	Ldexp(NaN, exp) = NaN
export function Ldexp(frac: number, exp: number): number {
	return ldexp(frac, exp)
}

export function ldexp(frac: number, exp: number): number {
	// Handle special cases
	if (frac === 0 || !Number.isFinite(frac) || Number.isNaN(frac)) {
		return frac
	}
	
	// Return frac × 2**exp
	return frac * Math.pow(2, exp)
}

