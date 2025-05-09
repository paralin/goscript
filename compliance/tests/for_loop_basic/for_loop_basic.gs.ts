// Generated file based on for_loop_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	;console.log("Starting loop")
	for (let i = 0; i < 3; i++) {
		;console.log("Iteration:", i)
	}
	;console.log("Loop finished")

	;console.log("Starting loop")
	let x = 0
	for (let _i = 0; _i < 5; _i++) {
		{
			;console.log("Iteration:", x)
			x++
		}
	}
	;console.log("Loop finished")
}

