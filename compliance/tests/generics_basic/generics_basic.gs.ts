// Generated file based on generics_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

function printVal<T extends any>(val: T): void {
	console.log(val)
}

export function main(): void {
	printVal(10)
	printVal("hello")
	printVal(true)
}

