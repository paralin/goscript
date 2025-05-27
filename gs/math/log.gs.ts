import * as $ from "@goscript/builtin/builtin.js";
import { Inf, IsInf, IsNaN, NaN } from "./bits.gs.js";
import { Frexp } from "./frexp.gs.js";
// archLog import removed - using optimized implementation

// Log returns the natural logarithm of x.
//
// Special cases are:
//
//	Log(+Inf) = +Inf
//	Log(0) = -Inf
//	Log(x < 0) = NaN
//	Log(NaN) = NaN
export function Log(x: number): number {
	return Math.log(x)
}

export function log(x: number): number {
	return Math.log(x)
}

