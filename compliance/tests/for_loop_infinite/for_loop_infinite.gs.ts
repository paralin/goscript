// Generated file based on for_loop_infinite.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	let i = 0
	for (; ; ) {
		console.log("Looping forever...")
		i++
		if (i >= 3) {
			break
		}
	}
	console.log("Loop finished")
}

