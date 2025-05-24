// Generated file based on pointer_composite_literal_untyped.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function main(): void {
	// This should trigger "unhandled composite literal type: *types.Pointer"
	// because the composite literal {} has no explicit type, but its type gets inferred as a pointer
	let ptr: { x?: number } | null = null
	ptr = {x: 42}
	console.log("Pointer value x:", ptr!.x)

	// Now try to use an untyped composite literal that resolves to a pointer
	// This is the case that should trigger the error
	let data = $.arrayToSlice<{ x?: number } | null>([{x: 42}, {x: 43}])

	console.log("First element x:", data![0]!.x)
	console.log("Second element x:", data![1]!.x)
}

