// Generated file based on variable_shadowing_scope.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export function firstFunc(): [string, number] {
	return ["", 42]
}

export function secondFunc(x: number): number {
	if (x != 0) {
		console.log("Got value:", x)
		return 0
	}
	return 99
}

export async function main(): Promise<void> {
	let [, x] = firstFunc()
	// This is the problematic pattern: x is shadowed but also used in the call
	{
		let x = secondFunc(x)
		if (x != 0) {
			console.log("Function returned value")
			return 
		}
	}
	console.log("Completed successfully")
}

