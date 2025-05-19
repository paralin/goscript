// Generated file based on map_support.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	// Create map using make
	let scores = $.makeMap<string, number>()
	console.log("Empty map created: Expected: true, Actual:", $.len(scores) == 0)

	// Add key-value pairs
	$.mapSet(scores, "Alice", 90)
	$.mapSet(scores, "Bob", 85)
	$.mapSet(scores, "Charlie", 92)

	// Map size
	console.log("Map size after adding 3 items: Expected: 3, Actual:", $.len(scores))

	// Access values
	console.log("Alice's score: Expected: 90, Actual:", $.mapGet(scores, "Alice", 0))
	console.log("Bob's score: Expected: 85, Actual:", $.mapGet(scores, "Bob", 0))

	// Modify a value
	$.mapSet(scores, "Bob", 88)
	console.log("Bob's updated score: Expected: 88, Actual:", $.mapGet(scores, "Bob", 0))

	// Check if key exists (comma-ok idiom)
	let value
	let exists: boolean
	exists = $.mapHas(scores, "David")
	value = $.mapGet(scores, "David", 0)
	console.log("Does David exist in map? Expected: false, Actual:", exists)
	console.log("Value for non-existent key: Expected: 0, Actual:", value)

	// Delete a key
	$.deleteMapEntry(scores, "Charlie")
	exists = $.mapHas(scores, "Charlie")
	console.log("After delete, does Charlie exist? Expected: false, Actual:", exists)

	// Create map with literal syntax
	let colors = new Map([["red", "#ff0000"], ["green", "#00ff00"], ["blue", "#0000ff"]])
	console.log("Map literal size: Expected: 3, Actual:", $.len(colors))
	console.log("Color code for red: Expected: #ff0000, Actual:", $.mapGet(colors, "red", ""))

	// Iterate over a map with range
	console.log("Iterating over scores map:")

	// Create a new map with string keys and string values for testing iteration
	let stringMap = new Map([["Alice", "A+"], ["Bob", "B+"], ["Charlie", "A"]])

	// Note: Map iteration is not ordered in Go, so we will collect the results and sort them for consistent test output.
	let scoreResults: $.Slice<string> = null

	// Using string concatenation to build the output string
	for (const [k, v] of stringMap.entries()) {
		const name = k
		const grade = v
		{
			// Using string concatenation to build the output string
			let result = "  - Name: " + name + " Grade: " + grade
			scoreResults = $.append(scoreResults, result)
		}
	}

	// Inline bubble sort for string slice
	// (avoid importing sort package yet)
	let n = $.len(scoreResults)
	for (let i = 0; i < n - 1; i++) {
		for (let j = 0; j < n - i - 1; j++) {
			if (scoreResults![j] > scoreResults![j + 1]) {
				[scoreResults![j], scoreResults![j + 1]] = [scoreResults![j + 1], scoreResults![j]]
			}
		}
	}

	for (let i = 0; i < $.len(scoreResults); i++) {
		const result = scoreResults![i]
		{
			console.log(result)
		}
	}
}

