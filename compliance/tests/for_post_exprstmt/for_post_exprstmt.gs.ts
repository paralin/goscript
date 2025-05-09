// Generated file based on for_post_exprstmt.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

let counter: number = 0

function increment_counter(): void {
	counter++
	;console.log("counter incremented to", counter)
}

export function main(): void {

	// We need to manually increment i or change the condition
	// to ensure the loop terminates as increment_counter() in post
	// does not affect 'i'.
	for (let i = 0; i < 2; (increment_counter)()) {
		;console.log("loop iteration:", i)
		// We need to manually increment i or change the condition
		// to ensure the loop terminates as increment_counter() in post
		// does not affect 'i'.
		i++
	}
	;console.log("done", "final counter:", counter)
}

