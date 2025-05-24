// Generated file based on package_import_slices.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as slices from "@goscript/slices/index.js"

export async function main(): Promise<void> {
	let s = $.arrayToSlice<number>([1, 2, 3, 4, 5])

	// This should trigger the interface range issue
	// slices.All returns an iterator interface that can be ranged over
	;(() => {
		let shouldContinue = true
		slices.All(s)((i, v) => {
			{
				console.log("index:", i, "value:", v)
			}
			return shouldContinue
		})
	})()
	console.log("test finished")
}

