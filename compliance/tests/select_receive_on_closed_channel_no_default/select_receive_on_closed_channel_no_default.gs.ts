// Generated file based on select_receive_on_closed_channel_no_default.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	let ch = $.makeChannel<number>(0, 0, 'both') // Unbuffered
	ch.close()

	//nolint:staticcheck

	// Should not be reached

	// Should be reached
	const [_selectHasReturn78, _selectValue78] = await $.selectStatement([
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
	if (_selectHasReturn78) {
		return _selectValue78!
	}
	// If _selectHasReturn78 is false, continue execution
}

