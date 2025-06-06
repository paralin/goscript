// Generated file based on select_receive_on_closed_channel_no_default.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	let ch = $.makeChannel<number>(0, 0, 'both') // Unbuffered
	ch.close()

	//nolint:staticcheck

	// Should not be reached

	// Should be reached
	const [_select_has_return_782d, _select_value_782d] = await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: ch,
			onSelected: async (result) => {
				const val = result.value
				const ok = result.ok
				if (ok) {
					console.log("Received value with ok==true:", val) // Should not be reached
				}
				 else {
					console.log("Received zero value with ok==false:", val) // Should be reached
				}
			}
		},
	], false)
	if (_select_has_return_782d) {
		return _select_value_782d!
	}
	// If _select_has_return_782d is false, continue execution
}

