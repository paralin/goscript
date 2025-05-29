// Generated file based on constants.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export let Pi: number = 3.14

export let Truth: boolean = false

// TODO: Handle large integer constants and bit shifts exceeding JS number limits.
// Big      = 1 << 60
// Small    = Big >> 59 // Commented out as it depends on Big
export let Greeting: string = "Hello, Constants!"

export let Nothing: null | any = null

export async function main(): Promise<void> {
	console.log(3.14)
	console.log(false)
	// println(Big) // Commented out until large integer handling is implemented
	// println(Small) // Commented out as it depends on Big
	console.log("Hello, Constants!")
	console.log($.byte(4))
}

