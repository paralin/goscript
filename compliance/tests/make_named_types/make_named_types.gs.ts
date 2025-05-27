// Generated file based on make_named_types.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	// Test make() calls with named types as the first argument
	// This tests the compiler's ability to handle make() with type aliases/named types
	// rather than direct type expressions like []int or map[string]int

	type MySlice = $.Slice<number>;
	let s: MySlice = $.makeSlice<number>(5, undefined, 'number')
	console.log("Length:", $.len(s))

	// Test make() with named map type
	type MyMap = Map<string, number>;
	let m: MyMap = $.makeMap<string, number>()
	$.mapSet(m, "test", 42)
	console.log("Value:", $.mapGet(m, "test", 0)[0])
}

