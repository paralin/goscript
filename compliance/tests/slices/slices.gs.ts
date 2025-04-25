// Generated file based on slices.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	// Create a slice of integers with length 5 and capacity 10
	let s = goscript.makeSlice("int", 5, 10)
	console.log(goscript.len(s))
	console.log(goscript.cap(s))
	
	// Create a slice of strings with length 3
	let s2 = goscript.makeSlice("string", 3)
	console.log(goscript.len(s2))
	console.log(goscript.cap(s2))
	
	// Assign values
	s[0] = 10
	s[4] = 20
	s2[1] = "hello"
	
	console.log(s[0])
	console.log(s[4])
	console.log(s2[1])
}

