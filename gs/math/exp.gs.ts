import * as $ from "@goscript/builtin/index.js";
import { Inf, IsInf, IsNaN } from "./bits.gs.js";
// archExp2 and archExp imports removed - using optimized implementation
import { Ldexp } from "./ldexp.gs.js";

// Exp returns e**x, the base-e exponential of x.
//
// Special cases are:
//
//	Exp(+Inf) = +Inf
//	Exp(NaN) = NaN
//
// Very large values overflow to 0 or +Inf.
// Very small values underflow to 1.
export function Exp(x: number): number {
	return Math.exp(x)
}

export function exp(x: number): number {
	return Math.exp(x)
}

// Exp2 returns 2**x, the base-2 exponential of x.
//
// Special cases are the same as [Exp].
export function Exp2(x: number): number {
	return Math.pow(2, x)
}

export function exp2(x: number): number {
	return Math.pow(2, x)
}

// exp1 returns e**r × 2**k where r = hi - lo and |r| ≤ ln(2)/2.
export function expmulti(hi: number, lo: number, k: number): number {
	const r = hi - lo
	return Math.exp(r) * Math.pow(2, k)
}

