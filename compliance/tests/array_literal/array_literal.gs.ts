// Generated file based on array_literal.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	// Test basic array literal
	//nolint:staticcheck
	let a: number[] = $.arrayToSlice([1, 2, 3])
	$.println(a![0], a![1], a![2])

	// Test array literal with inferred length
	let b = $.arrayToSlice(["hello", "world"])
	$.println(b![0], b![1])

	// Test array literal with specific element initialization
	let c = $.arrayToSlice([0, 10, 0, 30, 0])
	$.println(c![0], c![1], c![2], c![3], c![4])
}

