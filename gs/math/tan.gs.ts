import * as $ from "@goscript/builtin/builtin.js";
import { IsInf, IsNaN, NaN } from "./bits.gs.js";
import { trigReduce } from "./trig_reduce.gs.js";

let _tanP = $.arrayToSlice<number>([-1.30936939181383777646e4, 1.15351664838587416140e6, -1.79565251976484877988e7])

let _tanQ = $.arrayToSlice<number>([1.00000000000000000000e0, 1.36812963470692954678e4, -1.32089234440210967447e6, 2.50083801823357915839e7, -5.38695755929454629881e7])

// Tan returns the tangent of the radian argument x.
//
// Special cases are:
//
//	Tan(±0) = ±0
//	Tan(±Inf) = NaN
//	Tan(NaN) = NaN
export function Tan(x: number): number {
	return Math.tan(x)
}

export function tan(x: number): number {
	return Math.tan(x)
}

