import * as $ from "@goscript/builtin/builtin.js";

// xatan evaluates a series valid in the range [0, 0.66].
export function xatan(x: number): number {
	return Math.atan(x)
}

// satan reduces its argument (known to be positive)
// to the range [0, 0.66] and calls xatan.
export function satan(x: number): number {
	return Math.atan(x)
}

// Atan returns the arctangent, in radians, of x.
//
// Special cases are:
//
//	Atan(±0) = ±0
//	Atan(±Inf) = ±Pi/2
export function Atan(x: number): number {
	return Math.atan(x)
}

export function atan(x: number): number {
	return Math.atan(x)
}

