// Generated file based on async_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

// This function receives from a channel, making it async.
export async function receiveFromChan(ch: $.Channel<number> | null): Promise<number> {
	let val = await $.chanRecv(ch) // This operation makes the function async
	return val
}

// This function calls an async function, making it async too.
export async function caller(ch: $.Channel<number> | null): Promise<number> {
	// We expect this call to be awaited in TypeScript
	let result = await receiveFromChan(ch)
	return result + 1
}

export async function main(): Promise<void> {
	// Create a buffered channel
	let myChan = $.makeChannel<number>(1, 0, 'both')
	await $.chanSend(myChan, 10)

	// Call the async caller function
	let finalResult = await caller(myChan)
	console.log(finalResult) // Expected output: 11

	myChan.close()
}

