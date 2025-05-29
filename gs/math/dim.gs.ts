import * as $ from "@goscript/builtin/index.js";
import { Inf, IsInf, IsNaN, NaN } from "./bits.gs.js";
// archMax and archMin imports removed - using optimized implementation
import { Signbit } from "./signbit.gs.js";

// Dim returns the maximum of x-y or 0.
//
// Special cases are:
//
//	Dim(+Inf, +Inf) = NaN
//	Dim(-Inf, -Inf) = NaN
//	Dim(x, NaN) = Dim(NaN, x) = NaN
export function Dim(x: number, y: number): number {
	const v = x - y
	return v <= 0 ? 0 : v
}

// Max returns the larger of x or y.
//
// Special cases are:
//
//	Max(x, +Inf) = Max(+Inf, x) = +Inf
//	Max(x, NaN) = Max(NaN, x) = NaN
//	Max(+0, ±0) = Max(±0, +0) = +0
//	Max(-0, -0) = -0
//
// Note that this differs from the built-in function max when called
// with NaN and +Inf.
export function Max(x: number, y: number): number {
	return max(x, y)
}

export function max(x: number, y: number): number {
	// Handle NaN cases
	if (Number.isNaN(x) || Number.isNaN(y)) {
		return Number.NaN
	}
	
	// Handle infinity cases
	if (x === Number.POSITIVE_INFINITY || y === Number.POSITIVE_INFINITY) {
		return Number.POSITIVE_INFINITY
	}
	
	// Handle zero cases - prefer +0 over -0
	if (x === 0 && y === 0) {
		return Object.is(x, -0) ? y : x
	}
	
	return Math.max(x, y)
}

// Min returns the smaller of x or y.
//
// Special cases are:
//
//	Min(x, -Inf) = Min(-Inf, x) = -Inf
//	Min(x, NaN) = Min(NaN, x) = NaN
//	Min(-0, ±0) = Min(±0, -0) = -0
//
// Note that this differs from the built-in function min when called
// with NaN and -Inf.
export function Min(x: number, y: number): number {
	return min(x, y)
}

export function min(x: number, y: number): number {
	// Handle NaN cases
	if (Number.isNaN(x) || Number.isNaN(y)) {
		return Number.NaN
	}
	
	// Handle infinity cases
	if (x === Number.NEGATIVE_INFINITY || y === Number.NEGATIVE_INFINITY) {
		return Number.NEGATIVE_INFINITY
	}
	
	// Handle zero cases - prefer -0 over +0
	if (x === 0 && y === 0) {
		return Object.is(x, -0) ? x : y
	}
	
	return Math.min(x, y)
}

