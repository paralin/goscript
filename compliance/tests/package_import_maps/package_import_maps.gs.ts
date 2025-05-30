// Generated file based on package_import_maps.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as maps from "@goscript/maps/index.js"

import * as slices from "@goscript/slices/index.js"

export function getValue(): [string, number] {
	return ["test", 42]
}

// Simple iterator function that mimics maps.All behavior
export function simpleIterator(m: Map<string, number> | null): ((p0: ((p0: string, p1: number) => boolean) | null) => void) | null {
	return (_yield: ((p0: string, p1: number) => boolean) | null): void => {
		for (const [k, v] of m?.entries() ?? []) {
			{
				if (!_yield!(k, v)) {
					break
				}
			}
		}
	}
}

export async function main(): Promise<void> {
	// Create a map to test with
	let m = new Map([["a", 1], ["b", 2], ["c", 3]])

	// Collect results in a slice to ensure deterministic output
	let results: $.Slice<string> = null

	// Test maps.All which returns an iterator function (this tests the maps package import)

	// Simple assignment that should trigger the error
	;(() => {
		let shouldContinue = true
		maps.All(m)!((k, v) => {
			{
				// Simple assignment that should trigger the error
				let [x, y] = getValue()
				let result = k + x + $.runeOrStringToString(v + y)
				results = $.append(results, result)
			}
			return shouldContinue
		})
	})()

	// Also test simpleIterator to ensure our local iterator works
	;(() => {
		let shouldContinue = true
		simpleIterator(m)!((k, v) => {
			{
				let [x, y] = getValue()
				let result = k + x + $.runeOrStringToString(v + y) + "_local"
				results = $.append(results, result)
			}
			return shouldContinue
		})
	})()

	// Sort results for deterministic output
	slices.Sort(results)

	// Print sorted results
	for (let _i = 0; _i < $.len(results); _i++) {
		const result = results![_i]
		{
			console.log("Result:", result)
		}
	}

	console.log("test finished")
}

