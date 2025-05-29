import * as $ from "@goscript/builtin/index.js";
import { Abs } from "./abs.gs.js";
import { IsInf, IsNaN, NaN } from "./bits.gs.js";
import { trigReduce } from "./trig_reduce.gs.js";

let _sin = $.arrayToSlice<number>([1.58962301576546568060e-10, -2.50507477628578072866e-8, 2.75573136213857245213e-6, -1.98412698295895385996e-4, 8.33333333332211858878e-3, -1.66666666666666307295e-1])

let _cos = $.arrayToSlice<number>([-1.13585365213876817300e-11, 2.08757008419747316778e-9, -2.75573141792967388112e-7, 2.48015872888517045348e-5, -1.38888888888730564116e-3, 4.16666666666665929218e-2])

// Cos returns the cosine of the radian argument x.
//
// Special cases are:
//
//	Cos(±Inf) = NaN
//	Cos(NaN) = NaN
export function Cos(x: number): number {
	return Math.cos(x)
}

export function cos(x: number): number {
	return Math.cos(x)
}

// Sin returns the sine of the radian argument x.
//
// Special cases are:
//
//	Sin(±0) = ±0
//	Sin(±Inf) = NaN
//	Sin(NaN) = NaN
export function Sin(x: number): number {
	return Math.sin(x)
}

export function sin(x: number): number {
	return Math.sin(x)
}

