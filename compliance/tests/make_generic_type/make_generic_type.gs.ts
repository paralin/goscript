// Generated file based on make_generic_type.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type Ints<T extends $.Comparable> = Map<T, {  }> | null;

export async function main(): Promise<void> {
	// This should trigger the unhandled make call error
	// Similar to: seen := make(set.Ints[int64])
	let seen = $.makeMap<number, {  }>()

	// Test basic operations
	$.mapSet(seen, 42, {})
	let [, exists] = $.mapGet(seen, 42, {})
	console.log("Value exists:", exists)

	// Test with string type parameter
	let stringSet = $.makeMap<string, {  }>()
	$.mapSet(stringSet, "hello", {})
	let [, exists2] = $.mapGet(stringSet, "hello", {})
	console.log("String exists:", exists2)
}

