// Generated file based on atob.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

// ParseBool returns the boolean value represented by the string.
// It accepts 1, t, T, TRUE, true, True, 0, f, F, FALSE, false, False.
// Any other value returns an error.
export function ParseBool(str: string): [boolean, $.Error] {
	switch (str) {
		case "1", "t", "T", "true", "TRUE", "True":
			return [true, null]
			break
		case "0", "f", "F", "false", "FALSE", "False":
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
export function AppendBool(dst: $.Slice<number>, b: boolean): $.Slice<number> {
	if (b) {
		return $.append(dst, "true")
	}
	return $.append(dst, "false")
}

