// Generated file based on labeled_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	// Test labeled statements with different statement types

	// Label with a for loop and continue
	label1: for (let i = 0; i < 3; i++) {
		if (i == 1) {
			continue
		}
		console.log("continue test i:", i)
	}

	// Label with a variable declaration (this was causing the TypeScript error)
	let x: number = 42
	console.log("x:", x)

	// Label with a block statement and goto
	// unhandled branch statement token: goto
	console.log("this should be skipped")

	label2: {
		let y: number = 100
		console.log("y:", y)
	}

	// Label with a for loop and break
	label3: for (let i = 0; i < 5; i++) {
		if (i == 3) {
			break
		}
		console.log("i:", i)
	}

	// Nested labels
	outer: for (let i = 0; i < 3; i++) {
		inner: for (let j = 0; j < 3; j++) {
			if (i == 1 && j == 1) {
				break
			}
			if (j == 1) {
				continue
			}
			console.log("nested:", i, j)
		}
	}

	console.log("test finished")
}

