import * as $ from "@goscript/builtin/builtin.js";
import { Abs } from "./abs.gs.js";
import { Exp } from "./exp.gs.js";

// Sinh returns the hyperbolic sine of x.
//
// Special cases are:
//
//	Sinh(±0) = ±0
//	Sinh(±Inf) = ±Inf
//	Sinh(NaN) = NaN
export function Sinh(x: number): number {
	return Math.sinh(x)
}

export function sinh(x: number): number {
	return Math.sinh(x)
}

// Cosh returns the hyperbolic cosine of x.
//
// Special cases are:
//
//	Cosh(±0) = 1
//	Cosh(±Inf) = +Inf
//	Cosh(NaN) = NaN
export function Cosh(x: number): number {
	return Math.cosh(x)
}

export function cosh(x: number): number {
	return Math.cosh(x)
}

