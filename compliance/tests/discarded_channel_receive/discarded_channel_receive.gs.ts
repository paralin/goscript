// Generated file based on discarded_channel_receive.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export async function main(): Promise<void> {
	let ch = $.makeChannel<number>(0, 0)

	// Close the channel to allow the main goroutine to exit
	queueMicrotask(async () => {
		{
			await ch.send(1)
			;ch.close() // Close the channel to allow the main goroutine to exit
		}
	})
	await ch.receive()
	;console.log("done") // Add a print statement to verify execution
}

