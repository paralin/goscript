// Generated file based on for_init_value_ok.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	let m = $.makeMap<string, number>()
	$.mapSet(m, "key1", 10)
	$.mapSet(m, "key2", 20)

	// This should trigger the compiler error: for loop initialization with value, ok pattern
	for (let value = $.mapGet(m, "key1", 0), ok = $.mapHas(m, "key1"); ok; ) {
		console.log("value:", value)
		break
	}

	// Another case that might trigger the error
	for (let v = $.mapGet(m, "key2", 0), exists = $.mapHas(m, "key2"); exists && v > 0; ) {
		console.log("v:", v)
		break
	}
}

