import * as $ from "@goscript/builtin/index.js";
import { Inf, IsInf, IsNaN, normalize } from "./bits.gs.js";
import { Float64bits } from "./unsafe.gs.js";

// Logb returns the binary exponent of x.
//
// Special cases are:
//
//	Logb(±Inf) = +Inf
//	Logb(0) = -Inf
//	Logb(NaN) = NaN
export function Logb(x: number): number {
	// Handle special cases
	if (x === 0) {
		return Number.NEGATIVE_INFINITY
	}
	
	if (!Number.isFinite(x)) {
		return Number.POSITIVE_INFINITY
	}
	
	if (Number.isNaN(x)) {
		return x
	}
	
	return Math.floor(Math.log2(Math.abs(x)))
}

// Ilogb returns the binary exponent of x as an integer.
//
// Special cases are:
//
//	Ilogb(±Inf) = MaxInt32
//	Ilogb(0) = MinInt32
//	Ilogb(NaN) = MaxInt32
export function Ilogb(x: number): number {
	// Handle special cases
	if (x === 0) {
		return -2147483648 // MinInt32
	}
	
	if (Number.isNaN(x) || !Number.isFinite(x)) {
		return 2147483647 // MaxInt32
	}
	
	return Math.floor(Math.log2(Math.abs(x)))
}

// ilogb returns the binary exponent of x. It assumes x is finite and
// non-zero.
export function ilogb(x: number): number {
	return Math.floor(Math.log2(Math.abs(x)))
}

