// Generated file based on variadic_interface_param.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

// testVariadicInterface tests the TypeScript generation for functions
// with variadic ...interface{} parameters
export function testVariadicInterface(name: string, ...values: null | any[]): void {
	console.log("Name:", name)
	console.log("Values count:", $.len(values))

	// We can't do much with interface{} values in the compiled output
	// but we can at least check they're passed correctly
	for (let i = 0; i < $.len(values); i++) {
		const v = values![i]
		{
			// We can't do much with interface{} values in the compiled output
			// but we can at least check they're passed correctly
			if (v != null) {
				console.log("Value", i, "is not nil")
			} else {
				console.log("Value", i, "is nil")
			}
		}
	}
}

export async function main(): Promise<void> {
	// Test with various argument types
	testVariadicInterface("test1", "hello", 42, true)
	testVariadicInterface("test2", null, "world")
	testVariadicInterface("test3")

	// Test with slice expansion
	let values = $.arrayToSlice<null | any>(["a", "b", "c"])
	testVariadicInterface("test4", ...values!)
}

