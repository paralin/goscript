// Generated file based on constants.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

let Pi: number = 3.14

let Truth: boolean = false

// TODO: Handle large integer constants and bit shifts exceeding JS number limits.
// Big      = 1 << 60
// Small    = Big >> 59 // Commented out as it depends on Big
let Greeting: string = "Hello, Constants!"

export function main(): void {
	console.log(Pi)
	console.log(Truth)
	// println(Big) // Commented out until large integer handling is implemented
	// println(Small) // Commented out as it depends on Big
	console.log(Greeting)
}

