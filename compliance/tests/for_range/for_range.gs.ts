// Generated file based on for_range.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let nums = $.arrayToSlice<number>([2, 3, 4])
	let sum = 0
	for (let i = 0; i < $.len(nums); i++) {
		const num = nums![i]
		{
			sum += num
		}
	}
	console.log("sum:", sum)

	for (let i = 0; i < $.len(nums); i++) {
		const num = nums![i]
		{
			console.log("index:", i, "value:", num)
		}
	}

	// Test ranging over an array
	let arr = $.arrayToSlice<string>(["a", "b", "c"])
	for (let i = 0; i < $.len(arr); i++) {
		const s = arr![i]
		{
			console.log("index:", i, "value:", s)
		}
	}

	// Test ranging over a string
	let str = "go"

	// Note: c will be a rune (int32)
	{
		const _runes = $.stringToRunes(str)
		for (let i = 0; i < _runes.length; i++) {
			const c = _runes[i]
			{
				console.log("index:", i, "value:", c) // Note: c will be a rune (int32)
			}
		}
	}

	// Test ranging over a slice without key or value
	console.log("Ranging over slice (no key/value):")
	for (let _i = 0; _i < $.len(nums); _i++) {
		{
			console.log("Iterating slice")
		}
	}

	// Test ranging over an array without key or value
	console.log("Ranging over array (no key/value):")
	for (let _i = 0; _i < $.len(arr); _i++) {
		{
			console.log("Iterating array")
		}
	}

	// Test ranging over a string without key or value
	console.log("Ranging over string (no key/value):")
	{
		const _runes = $.stringToRunes(str)
		for (let i = 0; i < _runes.length; i++) {
			{
				console.log("Iterating string")
			}
		}
	}
}

