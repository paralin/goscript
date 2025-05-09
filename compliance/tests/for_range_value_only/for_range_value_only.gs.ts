// Generated file based on for_range_value_only.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let s = $.arrayToSlice([10, 20, 30])
	let sum = 0
	for (let i = 0; i < s.length; i++) {
		const v = s[i]
		{
			sum += v
			$.println(v)
		}
	}
	$.println(sum)

	let arr = $.arrayToSlice(["a", "b", "c"])
	let concat = ""
	for (let i = 0; i < arr.length; i++) {
		const val = arr[i]
		{
			concat += val
			$.println(val)
		}
	}
	$.println(concat)

	// Test with blank identifier for value (should still iterate)
	$.println("Ranging with blank identifier for value:")
	let count = 0
	// Both key and value are blank identifiers
	for (let i = 0; i < s.length; i++) {
		{
			// Both key and value are blank identifiers
			count++
		}
	}
	$.println(count) // Should be 3
}

