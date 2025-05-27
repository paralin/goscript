import * as $ from "@goscript/builtin/builtin.js";
import { Abs } from "./abs.gs.js";
import { IsInf, IsNaN, NaN } from "./bits.gs.js";
import { Frexp } from "./frexp.gs.js";
import { Ldexp } from "./ldexp.gs.js";


// Mod returns the floating-point remainder of x/y.
// The magnitude of the result is less than y and its
// sign agrees with that of x.
//
// Special cases are:
//
//	Mod(±Inf, y) = NaN
//	Mod(NaN, y) = NaN
//	Mod(x, 0) = NaN
//	Mod(x, ±Inf) = x
//	Mod(x, NaN) = NaN
export function Mod(x: number, y: number): number {
	return mod(x, y)
}

export function mod(x: number, y: number): number {
	// Handle special cases
	if (y === 0 || !Number.isFinite(x) || Number.isNaN(x) || Number.isNaN(y)) {
		return Number.NaN
	}
	
	if (!Number.isFinite(y)) {
		return x
	}
	
	// JavaScript's % operator already implements the correct behavior for Mod
	return x % y
}

