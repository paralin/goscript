// Generated file based on map_assign_blank_both.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	let m = $.makeMap<string, number>()
	$.mapSet(m, "one", 1)
	console.log("Assigning m[\"one\"] to _, _ (key exists)")
	;[, ] = $.mapGet(m, "one", 0)
	console.log("Assigning m[\"two\"] to _, _ (key does not exist)")
	;[, ] = $.mapGet(m, "two", 0)
	console.log("done")
}

