import * as $ from "@goscript/builtin/index.js";
import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Abs returns the absolute value of x.
//
// Special cases are:
//
//	Abs(±Inf) = +Inf
//	Abs(NaN) = NaN
export function Abs(x: number): number {
	return Math.abs(x)
}

