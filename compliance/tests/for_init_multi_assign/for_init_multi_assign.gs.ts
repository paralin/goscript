// Generated file based on for_init_multi_assign.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {

	// Modify j to see a clearer change in output
	for (let i = 0, j = 1; i < 2; i++) {
		console.log(i, j)
		j += 10 // Modify j to see a clearer change in output
	}
}

