import * as $ from "@goscript/builtin/index.js";
import { IsInf, IsNaN } from "./bits.gs.js";
// archCeil, archFloor, archTrunc imports removed - using optimized implementation
import { Modf } from "./modf.gs.js";
import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Floor returns the greatest integer value less than or equal to x.
//
// Special cases are:
//
//	Floor(±0) = ±0
//	Floor(±Inf) = ±Inf
//	Floor(NaN) = NaN
export function Floor(x: number): number {
	return Math.floor(x)
}

export function floor(x: number): number {
	return Math.floor(x)
}

// Ceil returns the least integer value greater than or equal to x.
//
// Special cases are:
//
//	Ceil(±0) = ±0
//	Ceil(±Inf) = ±Inf
//	Ceil(NaN) = NaN
export function Ceil(x: number): number {
	return Math.ceil(x)
}

export function ceil(x: number): number {
	return Math.ceil(x)
}

// Trunc returns the integer value of x.
//
// Special cases are:
//
//	Trunc(±0) = ±0
//	Trunc(±Inf) = ±Inf
//	Trunc(NaN) = NaN
export function Trunc(x: number): number {
	return Math.trunc(x)
}

export function trunc(x: number): number {
	return Math.trunc(x)
}

// Round returns the nearest integer, rounding half away from zero.
//
// Special cases are:
//
//	Round(±0) = ±0
//	Round(±Inf) = ±Inf
//	Round(NaN) = NaN
export function Round(x: number): number {
	return Math.round(x)
}

// RoundToEven returns the nearest integer, rounding ties to even.
//
// Special cases are:
//
//	RoundToEven(±0) = ±0
//	RoundToEven(±Inf) = ±Inf
//	RoundToEven(NaN) = NaN
export function RoundToEven(x: number): number {
	// JavaScript doesn't have a built-in round-to-even, so we implement it
	if (isNaN(x) || !isFinite(x)) {
		return x
	}
	
	const truncated = Math.trunc(x)
	const fractional = Math.abs(x - truncated)
	
	if (fractional < 0.5) {
		return truncated
	} else if (fractional > 0.5) {
		return truncated + Math.sign(x)
	} else {
		// Exactly 0.5 - round to even
		return truncated % 2 === 0 ? truncated : truncated + Math.sign(x)
	}
}

