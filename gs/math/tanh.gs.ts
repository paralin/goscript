import * as $ from "@goscript/builtin/builtin.js";
import { Abs } from "./abs.gs.js";
import { Exp } from "./exp.gs.js";

let tanhP = $.arrayToSlice<number>([-9.64399179425052238628e-1, -9.92877231001918586564e1, -1.61468768441708447952e3])

let tanhQ = $.arrayToSlice<number>([1.12811678491632931402e2, 2.23548839060100448583e3, 4.84406305325125486048e3])

// Tanh returns the hyperbolic tangent of x.
//
// Special cases are:
//
//	Tanh(±0) = ±0
//	Tanh(±Inf) = ±1
//	Tanh(NaN) = NaN
export function Tanh(x: number): number {
	return Math.tanh(x)
}

export function tanh(x: number): number {
	return Math.tanh(x)
}

