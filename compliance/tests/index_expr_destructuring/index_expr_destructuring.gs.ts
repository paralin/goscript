// Generated file based on index_expr_destructuring.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export function returnTwoInts(): [number, number] {
	return [42, 24]
}

export function returnIntAndString(): [number, string] {
	return [42, "hello"]
}

export async function main(): Promise<void> {
	// Create arrays/slices to test index expressions in destructuring
	let intArray: number[] = [0, 0]
	let stringSlice: $.Slice<string> = $.makeSlice<string>(2, undefined, 'string')

	// This should trigger the "unhandled LHS expression in destructuring: *ast.IndexExpr" error
	{
	  const _tmp = returnIntAndString()
	  intArray![0] = _tmp[0]
	  stringSlice![1] = _tmp[1]
	}

	console.log("intArray[0]:", intArray![0])
	console.log("stringSlice[1]:", stringSlice![1])

	// Test with more complex index expressions
	let matrix: number[][] = [[0, 0], [0, 0]]
	let [i, j] = [0, 1]

	{
	  const _tmp = returnTwoInts()
	  matrix![i]![j] = _tmp[0]
	  intArray![1] = _tmp[1]
	}

	console.log("matrix[0][1]:", matrix![0]![1])
	console.log("intArray[1]:", intArray![1])
}

