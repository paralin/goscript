// Generated file based on block_comments.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	/* Another single-line block comment */
	console.log("testing block comments")

	/*
	 *
	 *		Multi-line comment
	 *		in the middle of code
	 *	
	 */

	let x = 42 // inline block comment
	console.log("x =", x)
}

