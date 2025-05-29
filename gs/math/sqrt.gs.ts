import * as $ from "@goscript/builtin/index.js";
import { IsInf, IsNaN, NaN } from "./bits.gs.js";
import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Sqrt returns the square root of x.
//
// Special cases are:
//
//	Sqrt(+Inf) = +Inf
//	Sqrt(±0) = ±0
//	Sqrt(x < 0) = NaN
//	Sqrt(NaN) = NaN
export function Sqrt(x: number): number {
	return Math.sqrt(x)
}

export function sqrt(x: number): number {
	return Math.sqrt(x)
}

