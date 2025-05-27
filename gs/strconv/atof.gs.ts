import * as $ from "@goscript/builtin/builtin.js";
import { ErrSyntax, ErrRange, NumError } from "./atoi.gs.js";

// ParseFloat converts the string s to a floating-point number
// with the precision specified by bitSize: 32 for float32, or 64 for float64.
// When bitSize=32, the result still has type float64, but it will be
// convertible to float32 without changing its value.
export function ParseFloat(s: string, bitSize: number): [number, $.GoError] {
	if (s === "") {
		return [0, new NumError({Func: "ParseFloat", Num: s, Err: ErrSyntax})];
	}

	// Validate bitSize
	if (bitSize !== 32 && bitSize !== 64) {
		return [0, new NumError({Func: "ParseFloat", Num: s, Err: ErrSyntax})];
	}

	// Handle special cases
	const lower = s.toLowerCase();
	switch (lower) {
		case "+inf":
		case "inf":
		case "+infinity":
		case "infinity":
			return [Infinity, null];
		case "-inf":
		case "-infinity":
			return [-Infinity, null];
		case "nan":
			return [NaN, null];
	}

	// Remove underscores if present (Go allows them in numeric literals)
	let cleanS = s;
	if (s.includes('_')) {
		cleanS = s.replace(/_/g, '');
	}

	// Use JavaScript's parseFloat
	const result = parseFloat(cleanS);
	
	if (isNaN(result)) {
		return [0, new NumError({Func: "ParseFloat", Num: s, Err: ErrSyntax})];
	}

	// Check for range errors based on bitSize
	if (bitSize === 32) {
		const maxFloat32 = 3.4028234663852886e+38;
		const minFloat32 = 1.175494351e-38;
		
		if (isFinite(result) && Math.abs(result) > maxFloat32) {
			return [result > 0 ? Infinity : -Infinity, new NumError({Func: "ParseFloat", Num: s, Err: ErrRange})];
		}
		if (isFinite(result) && result !== 0 && Math.abs(result) < minFloat32) {
			return [0, new NumError({Func: "ParseFloat", Num: s, Err: ErrRange})];
		}
	}

	return [result, null];
} 