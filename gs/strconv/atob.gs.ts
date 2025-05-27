import * as $ from "@goscript/builtin/builtin.js";
import { syntaxError } from "./atoi.gs.js";

// ParseBool returns the boolean value represented by the string.
// It accepts 1, t, T, TRUE, true, True, 0, f, F, FALSE, false, False.
// Any other value returns an error.
export function ParseBool(str: string): [boolean, $.GoError] {
	switch (str) {
		case "1":
		case "t":
		case "T":
		case "true":
		case "TRUE":
		case "True":
			return [true, null]
			break
		case "0":
		case "f":
		case "F":
		case "false":
		case "FALSE":
		case "False":
			return [false, null]
			break
	}
	return [false, syntaxError("ParseBool", str)]
}

// FormatBool returns "true" or "false" according to the value of b.
export function FormatBool(b: boolean): string {
	if (b) {
		return "true"
	}
	return "false"
}

// AppendBool appends "true" or "false", according to the value of b,
// to dst and returns the extended buffer.
export function AppendBool(dst: $.Bytes, b: boolean): $.Bytes {
	if (b) {
		return $.append(dst, ...$.stringToBytes("true"))
	}
	return $.append(dst, ...$.stringToBytes("false"))
}

