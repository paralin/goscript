import * as $ from "@goscript/builtin/index.js";
import { Float64bits } from "./unsafe.gs.js";

// Signbit reports whether x is negative or negative zero.
export function Signbit(x: number): boolean {
	return x < 0 || Object.is(x, -0)
}

