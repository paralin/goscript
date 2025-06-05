// Generated file based on select_send_on_full_buffered_channel_with_default.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	let ch = $.makeChannel<number>(1, 0, 'both')
	await $.chanSend(ch, 1)

	// TODO: The comments on the following cases are written twice in the output.

	// Should not be reached

	// Should be reached
	const [_selectHasReturn163, _selectValue163] = await $.selectStatement([
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
	if (_selectHasReturn163) {
		return _selectValue163!
	}
	// If _selectHasReturn163 is false, continue execution
}

