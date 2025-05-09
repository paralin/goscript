// Generated file based on for_range_no_vars.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let s = $.arrayToSlice([10, 20, 30])
	$.println("Looping over slice (no vars):")
	let count = 0
	for (let _i = 0; _i < s.length; _i++) {
		{
			count++
		}
	}
	$.println(count) // Expected output: 3

	let a = $.arrayToSlice(["alpha", "beta"])
	$.println("Looping over array (no vars):")
	let arrCount = 0
	for (let _i = 0; _i < a.length; _i++) {
		{
			$.println(a![arrCount])
			arrCount++
		}
	}
	$.println(arrCount) // Expected output: 2

	$.println("Ranging over number (no vars):")
	let numCount = 0
	for (let _i = 0; _i < 5; _i++) {
		{
			numCount++
		}
	}
	$.println(numCount) // Expected output: 5
}

