// Generated file based on for_post_assign_stmt.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let x: number = 0
	// The post statement 'x = i' is an AssignStmt

	// Increment i inside the loop body to ensure the loop progresses
	// and to clearly separate the loop's own increment from the post statement.
	for (let i = 0; i < 3; x = i) {
		$.println("looping, i:", i, "x_before_post:", x)
		// Increment i inside the loop body to ensure the loop progresses
		// and to clearly separate the loop's own increment from the post statement.
		i++
	}
	$.println("final x:", x)
}

