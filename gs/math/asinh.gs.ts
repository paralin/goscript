import * as $ from "@goscript/builtin/index.js";
import { IsInf, IsNaN } from "./bits.gs.js";
import { Log } from "./log.gs.js";
import { Log1p } from "./log1p.gs.js";
import { Sqrt } from "./sqrt.gs.js";

// Asinh returns the inverse hyperbolic sine of x.
//
// Special cases are:
//
//	Asinh(±0) = ±0
//	Asinh(±Inf) = ±Inf
//	Asinh(NaN) = NaN
export function Asinh(x: number): number {
	return Math.asinh(x)
}

export function asinh(x: number): number {
	return Math.asinh(x)
}

