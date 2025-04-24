// Generated file based on test_for_range.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export function main(): void {
	let nums = [2, 3, 4]
	let sum = 0
	for (let i = 0; i < nums.length; i++) {
		const num = nums[i]
		{
			sum += num
		}
	}
	// unsupported range loop
	// error writing range loop: unsupported range loop type: *types.Slice
	console.log("sum:", sum)
	
	for (let i = 0; i < nums.length; i++) {
		const num = nums[i]
		{
			console.log("index:", i, "value:", num)
		}
	}
	// unsupported range loop
	// error writing range loop: unsupported range loop type: *types.Slice
	
	// Test ranging over an array
	let arr = ["a", "b", "c"]
	for (let i = 0; i < arr.length; i++) {
		const s = arr[i]
		{
			console.log("index:", i, "value:", s)
		}
	}
	// unsupported range loop
	// error writing range loop: unsupported range loop type: *types.Array
	
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

