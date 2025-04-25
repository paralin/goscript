// Generated file based on channel_basic.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	let messages = goscript.makeChannel<string>(0)
	
	queueMicrotask(async () => {
		{
			await messages.send("ping")
		}
	})
	
	let msg = await messages.receive()
	console.log(msg)
}

