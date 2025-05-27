import * as $ from "@goscript/builtin/builtin.js";
import { IsInf, IsNaN, NaN } from "./bits.gs.js";
import { Mod } from "./mod.gs.js";


// Remainder returns the IEEE 754 floating-point remainder of x/y.
//
// Special cases are:
//
//	Remainder(±Inf, y) = NaN
//	Remainder(NaN, y) = NaN
//	Remainder(x, 0) = NaN
//	Remainder(x, ±Inf) = x
//	Remainder(x, NaN) = NaN
export function Remainder(x: number, y: number): number {
	return remainder(x, y)
}

export function remainder(x: number, y: number): number {
	// Handle special cases
	if (Number.isNaN(x) || Number.isNaN(y) || !Number.isFinite(x) || y === 0) {
		return Number.NaN
	}
	
	if (!Number.isFinite(y)) {
		return x
	}
	
	// IEEE 754 remainder: x - n*y where n is the integer nearest to x/y
	const n = Math.round(x / y)
	return x - n * y
}

