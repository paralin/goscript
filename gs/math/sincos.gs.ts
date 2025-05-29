import * as $ from "@goscript/builtin/index.js";
import { IsInf, IsNaN, NaN } from "./bits.gs.js";
import { trigReduce } from "./trig_reduce.gs.js";

// Sincos returns Sin(x), Cos(x).
//
// Special cases are:
//
//	Sincos(±0) = ±0, 1
//	Sincos(±Inf) = NaN, NaN
//	Sincos(NaN) = NaN, NaN
export function Sincos(x: number): [number, number] {
	return [Math.sin(x), Math.cos(x)]
}

