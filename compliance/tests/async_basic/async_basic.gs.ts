// Generated file based on async_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

// This function receives from a channel, making it async.
async function receiveFromChan(ch: goscript.Channel<number>): Promise<number> {
	let val = await ch.receive() // This operation makes the function async
	return val
}

// This function calls an async function, making it async too.
async function caller(ch: goscript.Channel<number>): Promise<number> {
	// We expect this call to be awaited in TypeScript
	let result = await receiveFromChan(ch)
	return result + 1
}

export async function main(): Promise<void> {
	// Create a buffered channel
	let myChan = goscript.makeChannel<number>(1)
	await myChan.send(10)
	
	// Call the async caller function
	let finalResult = await caller(myChan)
	console.log(finalResult) // Expected output: 11
	
	myChan.close()
}

