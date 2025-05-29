import * as $ from "@goscript/builtin/index.js";
import { Frexp } from "./frexp.gs.js";
import { Log } from "./log.gs.js";


// Log10 returns the decimal logarithm of x.
// The special cases are the same as for [Log].
export function Log10(x: number): number {
	return Math.log10(x)
}

export function log10(x: number): number {
	return Math.log10(x)
}

// Log2 returns the binary logarithm of x.
// The special cases are the same as for [Log].
export function Log2(x: number): number {
	return Math.log2(x)
}

export function log2(x: number): number {
	return Math.log2(x)
}

