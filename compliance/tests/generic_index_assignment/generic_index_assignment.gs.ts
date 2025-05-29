// Generated file based on generic_index_assignment.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export function modifyGenericSlice<S extends $.Slice<E>, E extends any>(s: S, i: number, v: E): void {
	// This line causes the issue: s[i] = v
	// For generic slice types, the compiler should generate proper assignment
	// But currently it may generate: $.indexStringOrBytes(s, i) = v
	// which is invalid TypeScript syntax
	s![i] = v
}

export async function main(): Promise<void> {
	let slice = $.arrayToSlice<number>([1, 2, 3])
	modifyGenericSlice(slice, 1, 42)

	console.log("slice[0]:", slice![0])
	console.log("slice[1]:", slice![1])
	console.log("slice[2]:", slice![2])
	console.log("test finished")
}

