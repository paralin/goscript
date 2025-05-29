// Generated file based on channel_receive_both_blank.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	let ch = $.makeChannel<number>(1, 0, 'both')

	// Send a value to the channel
	await $.chanSend(ch, 42)

	// Receive with both value and ok discarded
	await $.chanRecvWithOk(ch)

	console.log("received and discarded value and ok")

	// Close the channel
	ch.close()

	// Receive from closed channel with both discarded
	await $.chanRecvWithOk(ch)

	console.log("received from closed channel, both discarded")
}

