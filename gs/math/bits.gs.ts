import * as $ from "@goscript/builtin/index.js";
import { Abs } from "./abs.gs.js";
import { Float64frombits } from "./unsafe.gs.js";

let uvnan: number = 0x7FF8000000000001

let uvinf: number = 0x7FF0000000000000

let uvneginf: number = 0xFFF0000000000000

let uvone: number = 0x3FF0000000000000

let mask: number = 0x7FF

let shift: number = 64 - 11 - 1

let bias: number = 1023

let signMask: number = Number.MAX_SAFE_INTEGER

let fracMask: number = (1 << 52) - 1

// Inf returns positive infinity if sign >= 0, negative infinity if sign < 0.
export function Inf(sign: number): number {
	return sign >= 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
}

// NaN returns an IEEE 754 "not-a-number" value.
export function NaN(): number {
	return Number.NaN
}

// IsNaN reports whether f is an IEEE 754 "not-a-number" value.
export function IsNaN(f: number): boolean {
	return Number.isNaN(f)
}

// IsInf reports whether f is an infinity, according to sign.
// If sign > 0, IsInf reports whether f is positive infinity.
// If sign < 0, IsInf reports whether f is negative infinity.
// If sign == 0, IsInf reports whether f is either infinity.
export function IsInf(f: number, sign: number): boolean {
	if (sign > 0) {
		return f === Number.POSITIVE_INFINITY
	} else if (sign < 0) {
		return f === Number.NEGATIVE_INFINITY
	} else {
		return !Number.isFinite(f) && !Number.isNaN(f)
	}
}

// normalize returns a normal number y and exponent exp
// satisfying x == y × 2**exp. It assumes x is finite and non-zero.
export function normalize(x: number): [number, number] {
	const SmallestNormal = 2.2250738585072014e-308
	if (Math.abs(x) < SmallestNormal) {
		return [x * (1 << 52), -52]
	}
	return [x, 0]
}

