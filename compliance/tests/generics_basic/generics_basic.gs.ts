// Generated file based on generics_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export function printVal<T extends any>(val: T): void {
	console.log(val)
}

export async function main(): Promise<void> {
	printVal(10)
	printVal("hello")
	printVal(true)
}

