// Generated file based on async_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

// This function receives from a channel, making it async.
function receiveFromChan(ch: /* channel type */): number {
	let val = /* unhandled unary op: <- */ch // This operation makes the function async
	return val
}

// This function calls an async function, making it async too.
function caller(ch: /* channel type */): number {
	// We expect this call to be awaited in TypeScript
	let result = receiveFromChan(ch)
	return result + 1
}

export function main(): void {
	// Create a buffered channel
	let myChan = 