// Generated file based on async_defer_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@goscript/builtin";

export async function main(): Promise<void> {
	await using __defer = new goscript.AsyncDisposableStack();
	let ch = goscript.makeChannel<boolean>(1, false)
	
	// Wait for signal from main
	__defer.defer(async () => {
		console.log("deferred start")
		await ch.receive()
		console.log("deferred end")
	});
	
	console.log("main start")
	console.log("main signaling defer")
	await ch.send(true)
	console.log("main end")
}

