import * as $ from "@goscript/builtin/builtin.js";
import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// Copysign returns a value with the magnitude of f
// and the sign of sign.
export function Copysign(f: number, sign: number): number {
	// Handle special cases for zero
	if (f === 0) {
		return sign < 0 || Object.is(sign, -0) ? -0 : 0
	}
	
	const magnitude = Math.abs(f)
	const signValue = Math.sign(sign)
	
	// Handle NaN case
	if (Number.isNaN(sign)) {
		return signValue < 0 ? -magnitude : magnitude
	}
	
	// Handle negative zero case
	if (Object.is(sign, -0)) {
		return -magnitude
	}
	
	return signValue < 0 ? -magnitude : magnitude
}

