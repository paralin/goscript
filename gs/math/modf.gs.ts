import * as $ from "@goscript/builtin/builtin.js";
// archModf import removed - using optimized implementation
import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Modf returns integer and fractional floating-point numbers
// that sum to f. Both values have the same sign as f.
//
// Special cases are:
//
//	Modf(±Inf) = ±Inf, NaN
//	Modf(NaN) = NaN, NaN
export function Modf(f: number): [number, number] {
	return modf(f)
}

export function modf(f: number): [number, number] {
	// Handle special cases
	if (Number.isNaN(f)) {
		return [Number.NaN, Number.NaN]
	}
	
	if (!Number.isFinite(f)) {
		return [f, Number.NaN]
	}
	
	// Get integer part using Math.trunc (preserves sign)
	const intPart = Math.trunc(f)
	const fracPart = f - intPart
	
	return [intPart, fracPart]
}

