// Generated file based on variadic_function_call.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as errors from "@goscript/errors/index.js"

// TestFS simulates the function signature from the user's example
export function TestFS(fsys: string, ...expected: string[]): $.GoError {
	return testFS(fsys, ...(expected ?? []))
}

// testFS is the variadic function being called
export function testFS(fsys: string, ...expected: string[]): $.GoError {
	if ($.len(expected) == 0) {
		return errors.New("no expected values")
	}

	for (let i = 0; i < $.len(expected); i++) {
		const exp = expected![i]
		{
			console.log("Expected[" + $.runeOrStringToString(i + 48) + "]: " + exp)
		}
	}

	console.log("File system: " + fsys)
	return null
}

export async function main(): Promise<void> {
	let expected = $.arrayToSlice<string>(["file1.txt", "file2.txt", "file3.txt"])

	// This is the problematic line - should generate spread syntax in TypeScript
	let err = TestFS("myfs", ...(expected ?? []))

	if (err != null) {
		console.log("Error: " + err!.Error())
	}
	 else {
		console.log("Success!")
	}
}

