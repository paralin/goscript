// Generated file based on select_receive_on_closed_channel_no_default.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	let ch = goscript.makeChannel<number>(0, 0) // Unbuffered
	ch.close()
	
	// Should not be reached
	
	// Should be reached
	const _tempVar1: goscript.SelectCase<any>[] = []
	_tempVar1.push({
		id: 0,
		isSend: false,
		channel: ch,
		onSelected: async (result) => {
			const val = result.value
			const ok = result.ok
			if (ok) {
				console.log("Received value with ok==true:", val) // Should not be reached
			} else {
				console.log("Received zero value with ok==false:", val) // Should be reached
			}
		}
	}),
	
	await goscript.selectStatement(_tempVar1, false)
}

