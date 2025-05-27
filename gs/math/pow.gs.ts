import * as $ from "@goscript/builtin/builtin.js";
import { Abs } from "./abs.gs.js";
import { Inf, IsInf, IsNaN, NaN } from "./bits.gs.js";
import { Exp } from "./exp.gs.js";
import { Frexp } from "./frexp.gs.js";
import { Ldexp } from "./ldexp.gs.js";
import { Log } from "./log.gs.js";
import { Modf } from "./modf.gs.js";
import { Signbit } from "./signbit.gs.js";
import { Sqrt } from "./sqrt.gs.js";


export function isOddInt(x: number): boolean {
	// 1 << 53 is the largest exact integer in the float64 format.
	if (Math.abs(x) >= (1 << 53)) {
		return false
	}
	
	const truncated = Math.trunc(x)
	const fractional = x - truncated
	return fractional === 0 && (truncated & 1) === 1
}

// Pow returns x**y, the base-x exponential of y.
//
// Special cases are (in order):
//
//	Pow(x, ±0) = 1 for any x
//	Pow(1, y) = 1 for any y
//	Pow(x, 1) = x for any x
//	Pow(NaN, y) = NaN
//	Pow(x, NaN) = NaN
//	Pow(±0, y) = ±Inf for y an odd integer < 0
//	Pow(±0, -Inf) = +Inf
//	Pow(±0, +Inf) = +0
//	Pow(±0, y) = +Inf for finite y < 0 and not an odd integer
//	Pow(±0, y) = ±0 for y an odd integer > 0
//	Pow(±0, y) = +0 for finite y > 0 and not an odd integer
//	Pow(-1, ±Inf) = 1
//	Pow(x, +Inf) = +Inf for |x| > 1
//	Pow(x, -Inf) = +0 for |x| > 1
//	Pow(x, +Inf) = +0 for |x| < 1
//	Pow(x, -Inf) = +Inf for |x| < 1
//	Pow(+Inf, y) = +Inf for y > 0
//	Pow(+Inf, y) = +0 for y < 0
//	Pow(-Inf, y) = Pow(-0, -y)
//	Pow(x, y) = NaN for finite x < 0 and finite non-integer y
export function Pow(x: number, y: number): number {
	return Math.pow(x, y)
}

export function pow(x: number, y: number): number {
	return Math.pow(x, y)
}

