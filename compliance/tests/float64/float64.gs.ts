// Generated file based on float64.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export function main(): void {
	let a: number = 1.23;
	let b = 4.56
	let c: number;
	
	c = a + b
	console.log("a + b =", c)
	
	c = a - b
	console.log("a - b =", c)
	
	c = a * b
	console.log("a * b =", c)
	
	c = a / b
	console.log("a / b =", c)
	
	// Assignment
	let d = 7.89
	c = d
	console.log("c =", c)
	
	// More complex expression
	let e = (a + b) * (c - d) / a
	console.log("(a + b) * (c - d) / a =", e)
}

