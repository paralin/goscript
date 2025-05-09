// Generated file based on async_defer_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export async function main(): Promise<void> {
	await using __defer = new $.AsyncDisposableStack();
	let ch = $.makeChannel<boolean>(1, false)

	// Wait for signal from main
	__defer.defer(async () => {
		$.println("deferred start")
		await ch.receive()
		$.println("deferred end")
	});

	$.println("main start")
	$.println("main signaling defer")
	await ch.send(true)
	$.println("main end")
}

