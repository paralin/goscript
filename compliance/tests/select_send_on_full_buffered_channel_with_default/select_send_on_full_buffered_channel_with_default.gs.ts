// Generated file based on select_send_on_full_buffered_channel_with_default.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	let ch = goscript.makeChannel<number>(1, 0)
	await ch.send(1)
	
	// Should not be reached
	
	// Should be reached
	await goscript.selectStatement([
		{
			id: 0,
			isSend: true,
			channel: ch,
			value: 2,
			onSelected: async (result) => {
				console.log("Sent value")
			}
		},
		
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("Default case hit")
			}
		},
		
	], true)
}

