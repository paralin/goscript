// Generated file based on named_slice_wrapper.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as os from "@goscript/os/index.js"

export type ByName = $.Slice<os.FileInfo>;

export function ByName_Len(a: ByName): number {
	return $.len(a)
}

export function ByName_Less(a: ByName, i: number, j: number): boolean {
	return a![i]!.Name() < a![j]!.Name()
}

export function ByName_Swap(a: ByName, i: number, j: number): void {
	;[a![i], a![j]] = [a![j], a![i]]
}


export async function main(): Promise<void> {
	// Create a ByName instance to test the wrapper
	let files: ByName = $.makeSlice<os.FileInfo>(2)
	console.log("Length:", ByName_Len(files))

	// Test type conversion
	let slice: $.Slice<os.FileInfo> = files
	console.log("Slice length:", $.len(slice))
}

