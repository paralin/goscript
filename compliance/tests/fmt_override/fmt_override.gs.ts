// Generated file based on fmt_override.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

import * as fmt from "@goscript/fmt"

export function main(): void {
	fmt.Printf("Hello %s!\n", "world")

	fmt.Println("Testing fmt override")

	let s = fmt.Sprintf("Value: %d", 42)
	console.log(s)
}

