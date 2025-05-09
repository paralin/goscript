// Generated file based on for_range_key_only.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let s = $.arrayToSlice([10, 20, 30])
	$.println("Looping over slice (key only):")

	// Expected output:
	// 0
	// 1
	// 2
	for (let i = 0; i < s.length; i++) {
		{
			$.println(i)
		}
	}

	let a = $.arrayToSlice(["alpha", "beta"])
	$.println("Looping over array (key only):")

	// Expected output:
	// 0
	// 1
	for (let k = 0; k < a.length; k++) {
		{
			$.println(k)
		}
	}
	// Expected output:
	// 0
	// 1
}

