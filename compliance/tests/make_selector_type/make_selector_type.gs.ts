// Generated file based on make_selector_type.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Test make() with a map type
	// This verifies that our fix for selector expressions in make() calls works
	// The original issue was "unhandled make call" when using selector expressions

	let mfs = $.makeMap<string, $.Bytes>()
	$.mapSet(mfs, "test.txt", $.stringToBytes("hello world"))
	console.log("Created map:", $.len(mfs))
	console.log("Content:", $.bytesToString($.mapGet(mfs, "test.txt", new Uint8Array(0))[0]))
}

