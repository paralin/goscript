// Generated file based on channel_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	let messages = $.makeChannel<string>(0, "", 'both')

	queueMicrotask(async () => {
		await $.chanSend(messages, "ping")
	})

	let msg = await $.chanRecv(messages)
	console.log(msg)
}

