import * as $ from "@goscript/builtin/builtin.js";
import { IsNaN, NaN } from "./bits.gs.js";
import { Log } from "./log.gs.js";
import { Log1p } from "./log1p.gs.js";
import { Sqrt } from "./sqrt.gs.js";

// Acosh returns the inverse hyperbolic cosine of x.
//
// Special cases are:
//
//	Acosh(+Inf) = +Inf
//	Acosh(x) = NaN if x < 1
//	Acosh(NaN) = NaN
export function Acosh(x: number): number {
	return Math.acosh(x)
}

export function acosh(x: number): number {
	return Math.acosh(x)
}

