// Generated file based on for_loop_condition_only.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	let i = 0
	for (; i < 3; ) {
		console.log("Current value:", i)
		i = i + 1
	}
	console.log("Loop finished")
}

