import * as $ from "@goscript/builtin/index.js";
import { Inf, IsInf, IsNaN } from "./bits.gs.js";

import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Expm1 returns e**x - 1, the base-e exponential of x minus 1.
// It is more accurate than [Exp](x) - 1 when x is near zero.
//
// Special cases are:
//
//	Expm1(+Inf) = +Inf
//	Expm1(-Inf) = -1
//	Expm1(NaN) = NaN
//
// Very large values overflow to -1 or +Inf.
export function Expm1(x: number): number {
	return Math.expm1(x)
}

export function expm1(x: number): number {
	return Math.expm1(x)
}

