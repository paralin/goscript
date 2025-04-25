// Generated file based on async_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

// This function receives from a channel, making it async.
async function receiveFromChan(ch: goscript.Chan<number>): Promise<number> {
	// Assume ch.receive() is the runtime equivalent for <-ch
	const [val] = await ch.receive()
	return val
}

// This function calls an async function, making it async too.
async function caller(ch: goscript.Chan<number>): Promise<number> {
	// We expect this call to be awaited in TypeScript
	const result = await receiveFromChan(ch)
	return result + 1
}

export async function main(): Promise<void> {
	// Create a buffered channel
	const myChan = goscript.makeChan<number>(1)
	// Assume ch.send() is the runtime equivalent for ch <- value
	await myChan.send(10) // Sending might be async too in the runtime

	// Call the async caller function
	const finalResult = await caller(myChan)
	console.log(finalResult) // Expected output: 11

	myChan.close()
}

// Required for top-level await
main()