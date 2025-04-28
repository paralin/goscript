// Generated file based on for_range.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

export async function main(): Promise<void> {
	let nums = [2, 3, 4]
	let sum = 0
	for (let i = 0; i < nums.length; i++) {
		const num = nums[i]
		{
			sum += num
		}
	}
	console.log("sum:", sum)

	for (let i = 0; i < nums.length; i++) {
		const num = nums[i]
		{
			console.log("index:", i, "value:", num)
		}
	}

	// Test ranging over an array
	let arr = ["a", "b", "c"]
	for (let i = 0; i < arr.length; i++) {
		const s = arr[i]
		{
			console.log("index:", i, "value:", s)
		}
	}

	// Test ranging over a string
	let str = "go"

	// Note: c will be a rune (int32)
	const _runes = goscript.stringToRunes(str)
	for (let i = 0; i < _runes.length; i++) {
		const c = _runes[i]
		{
			console.log("index:", i, "value:", c) // Note: c will be a rune (int32)
		}
	}
}

