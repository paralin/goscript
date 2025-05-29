import * as $ from "@goscript/builtin/index.js";
import { Abs } from "./abs.gs.js";
import { Inf, IsInf, IsNaN, NaN } from "./bits.gs.js";
// archHypot import removed - using optimized implementation
import { Sqrt } from "./sqrt.gs.js";

// Hypot returns [Sqrt](p*p + q*q), taking care to avoid
// unnecessary overflow and underflow.
//
// Special cases are:
//
//	Hypot(±Inf, q) = +Inf
//	Hypot(p, ±Inf) = +Inf
//	Hypot(NaN, q) = NaN
//	Hypot(p, NaN) = NaN
export function Hypot(p: number, q: number): number {
	return Math.hypot(p, q)
}

export function hypot(p: number, q: number): number {
	return Math.hypot(p, q)
}

