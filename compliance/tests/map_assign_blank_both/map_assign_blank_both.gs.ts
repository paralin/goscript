// Generated file based on map_assign_blank_both.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let m = $.makeMap<string, number>()
	$.mapSet(m, "one", 1)
	console.log("Assigning m[\"one\"] to _, _ (key exists)")
	;(m.has("one"), m.get("one"))
	console.log("Assigning m[\"two\"] to _, _ (key does not exist)")
	;(m.has("two"), m.get("two"))
	console.log("done")
}

