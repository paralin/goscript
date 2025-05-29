// Generated file based on for_range_value_only.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	let s = $.arrayToSlice<number>([10, 20, 30])
	let sum = 0
	for (let _i = 0; _i < $.len(s); _i++) {
		const v = s![_i]
		{
			sum += v
			console.log(v)
		}
	}
	console.log(sum)

	let arr = $.arrayToSlice<string>(["a", "b", "c"])
	let concat = ""
	for (let _i = 0; _i < $.len(arr); _i++) {
		const val = arr![_i]
		{
			concat += val
			console.log(val)
		}
	}
	console.log(concat)

	// Test with blank identifier for value (should still iterate)
	console.log("Ranging with blank identifier for value:")
	let count = 0
	// Both key and value are blank identifiers
	for (let _i = 0; _i < $.len(s); _i++) {
		{
			// Both key and value are blank identifiers
			count++
		}
	}
	console.log(count) // Should be 3
}

