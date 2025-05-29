// Generated file based on for_loop_multi_assign_mismatch.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export function getValues(): [number, boolean] {
	return [42, true]
}

export async function main(): Promise<void> {
	// This should trigger the error: multi-assignment in for loop init
	// where lhs has 2 variables but rhs has 1 expression that returns 2 values
	// but is not a map access
	for (let [value, ok] = getValues(); ok; ) {
		console.log("value:", value)
		break
	}

	console.log("done")
}

