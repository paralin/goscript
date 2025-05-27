import * as $ from "@goscript/builtin/builtin.js";
import { IsInf, IsNaN } from "./bits.gs.js";

import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Cbrt returns the cube root of x.
//
// Special cases are:
//
//	Cbrt(±0) = ±0
//	Cbrt(±Inf) = ±Inf
//	Cbrt(NaN) = NaN
export function Cbrt(x: number): number {
	return Math.cbrt(x)
}

export function cbrt(x: number): number {
	return Math.cbrt(x)
}

