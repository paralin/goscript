// Generated file based on func_literal.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	let greet = (name: string): string => {
		return "Hello, " + name
	}

	let message = greet!("world")
	console.log(message)
}

