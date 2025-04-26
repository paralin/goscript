// Generated file based on map_support.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	// Create map using make
	let scores = goscript.makeMap()
	console.log("Empty map created: Expected: true, Actual:", goscript.len(scores) == 0)
	
	// Add key-value pairs
	goscript.mapSet(scores, "Alice", 90)
	goscript.mapSet(scores, "Bob", 85)
	goscript.mapSet(scores, "Charlie", 92)
	
	// Map size
	console.log("Map size after adding 3 items: Expected: 3, Actual:", goscript.len(scores))
	
	// Access values
	console.log("Alice's score: Expected: 90, Actual:", scores.get("Alice"))
	console.log("Bob's score: Expected: 85, Actual:", scores.get("Bob"))
	
	// Modify a value
	goscript.mapSet(scores, "Bob", 88)
	console.log("Bob's updated score: Expected: 88, Actual:", scores.get("Bob"))
	
	// Check if key exists (comma-ok idiom)
	let value
	let exists
	exists = scores.has("David")
	value = scores.get("David") ?? 0
	console.log("Does David exist in map? Expected: false, Actual:", exists)
	console.log("Value for non-existent key: Expected: 0, Actual:", value)
	
	// Delete a key
	goscript.deleteMapEntry(scores, "Charlie")
	exists = scores.has("Charlie")
	console.log("After delete, does Charlie exist? Expected: false, Actual:", exists)
	
	// Create map with literal syntax
	let colors = new Map([["red", "#ff0000"], ["green", "#00ff00"], ["blue", "#0000ff"]])
	console.log("Map literal size: Expected: 3, Actual:", goscript.len(colors))
	console.log("Color code for red: Expected: #ff0000, Actual:", colors.get("red"))
	
	// Iterate over a map with range
	console.log("Iterating over scores map:")
	// Note: Map iteration is not ordered in Go, so we will collect the results and sort them for consistent test output.
	let scoreResults: string[] = [];
	
	// Using string concatenation to build the output string
	for (const [k, v] of scores.entries()) {
		const name = k
		const score = v
		{
			// Using string concatenation to build the output string
			let result = "  - Name: " + name + " Score: " + itoa(score)
			scoreResults = goscript.append(scoreResults, result)
		}
	}
	
	// Inline bubble sort for string slice
	// (avoid importing sort package yet)
	let n = goscript.len(scoreResults)
	for (let i = 0; i < n - 1; i++) {
		for (let j = 0; j < n - i - 1; j++) {
			if (scoreResults[j] > scoreResults[j + 1]) {
				scoreResults[j] = scoreResults[j + 1]
				scoreResults[j + 1] = scoreResults[j]
			}
		}
	}
	
	for (let i = 0; i < scoreResults.length; i++) {
		const result = scoreResults[i]
		{
			console.log(result)
		}
	}
}

// Helper function to convert int to string
// (avoid importing strings package)
function itoa(i: number): string {
	if (i == 0) {
		return "0"
	}
	let s = ""
	let isNegative = false
	if (i < 0) {
		isNegative = true
		i = -i
	}
	for (; i > 0; ) {
		s = String.fromCharCode(i % 10 + 48) + s
		i = Math.floor(i / 10)
	}
	if (isNegative) {
		s = "-" + s
	}
	return s
}

