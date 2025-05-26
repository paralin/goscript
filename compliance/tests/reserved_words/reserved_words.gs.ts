// Generated file based on reserved_words.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	// Test reserved word conflicts that cause TypeScript compilation errors
	// This reproduces the "let new: number = 0" error we saw
	let _new: number = 42
	let _class: string = "test"
	let _typeof: boolean = true

	console.log("new:", _new)
	console.log("class:", _class)
	console.log("typeof:", _typeof)

	// Test function with named return that uses reserved word
	let result = testNamedReturn()
	console.log("named return result:", result)

	console.log("test finished")
}

export function testNamedReturn(): number {
	let _new: number = 0
	{
		_new = 100
		return _new
	}
}

