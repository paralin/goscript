// Generated file based on if_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	// === If Statement ===
	let n = 7
	if (n % 2 == 0) {
		$.println("Even: Expected: (no output)")
	} else {
		$.println("Odd: Expected: Odd, Actual: Odd")
	}
}

