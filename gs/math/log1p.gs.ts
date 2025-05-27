import * as $ from "@goscript/builtin/builtin.js";
import { Abs } from "./abs.gs.js";
import { Inf, IsInf, IsNaN, NaN } from "./bits.gs.js";

import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Log1p returns the natural logarithm of 1 plus its argument x.
// It is more accurate than [Log](1 + x) when x is near zero.
//
// Special cases are:
//
//	Log1p(+Inf) = +Inf
//	Log1p(±0) = ±0
//	Log1p(-1) = -Inf
//	Log1p(x < -1) = NaN
//	Log1p(NaN) = NaN
export function Log1p(x: number): number {
	return Math.log1p(x)
}

export function log1p(x: number): number {
	return Math.log1p(x)
}

