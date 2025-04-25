// Generated file based on for_range_index_use.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	let slice = [10, 20, 30, 40, 50]
	let sum = 0
	for (let idx = 0; idx < slice.length; idx++) {
		const val = slice[idx]
		{
			sum += val
			console.log("Range idx:", idx, "val:", val)
		}
	}
	console.log("Sum:", sum)
}

