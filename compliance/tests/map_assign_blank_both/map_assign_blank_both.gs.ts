// Generated file based on map_assign_blank_both.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	let m = $.makeMap<string, number>()
	$.mapSet(m, "one", 1)
	console.log("Assigning m[\"one\"] to _, _ (key exists)")
	;($.mapHas(m, "one"), $.mapGet(m, "one", null))
	console.log("Assigning m[\"two\"] to _, _ (key does not exist)")
	;($.mapHas(m, "two"), $.mapGet(m, "two", null))
	console.log("done")
}

