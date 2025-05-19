// Generated file based on for_range_key_only.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	let s = $.arrayToSlice<number>([10, 20, 30])
	console.log("Looping over slice (key only):")

	// Expected output:
	// 0
	// 1
	// 2
	for (let i = 0; i < $.len(s); i++) {
		{
			console.log(i)
		}
	}

	let a = $.arrayToSlice<string>(["alpha", "beta"])
	console.log("Looping over array (key only):")

	// Expected output:
	// 0
	// 1
	for (let k = 0; k < $.len(a); k++) {
		{
			console.log(k)
		}
	}
	// Expected output:
	// 0
	// 1
}

