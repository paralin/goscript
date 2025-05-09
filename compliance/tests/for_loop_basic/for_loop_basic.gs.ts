// Generated file based on for_loop_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	$.println("Starting loop")
	for (let i = 0; i < 3; i++) {
		$.println("Iteration:", i)
	}
	$.println("Loop finished")

	$.println("Starting loop")
	let x = 0
	for (let _i = 0; _i < 5; _i++) {
		{
			$.println("Iteration:", x)
			x++
		}
	}
	$.println("Loop finished")
}

