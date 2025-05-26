// Generated file based on octal_literals.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	// Test octal literals that cause TypeScript compilation errors
	let perm1 = 0o777
	let perm2 = 0o666
	let perm3 = 0o644
	let perm4 = 0o755

	console.log("perm1:", perm1)
	console.log("perm2:", perm2)
	console.log("perm3:", perm3)
	console.log("perm4:", perm4)

	console.log("test finished")
}

