import * as $ from "@goscript/builtin/builtin.js";
import { Inf, IsNaN, NaN } from "./bits.gs.js";
import { Log1p } from "./log1p.gs.js";

// Atanh returns the inverse hyperbolic tangent of x.
//
// Special cases are:
//
//	Atanh(1) = +Inf
//	Atanh(±0) = ±0
//	Atanh(-1) = -Inf
//	Atanh(x) = NaN if x < -1 or x > 1
//	Atanh(NaN) = NaN
export function Atanh(x: number): number {
	return Math.atanh(x)
}

export function atanh(x: number): number {
	return Math.atanh(x)
}

