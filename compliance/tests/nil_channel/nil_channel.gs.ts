// Generated file based on nil_channel.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Test nil channel operations

	// Test 1: Using nil channel in select with default
	console.log("Test 1: Select with nil channel and default")
	let nilCh: $.Channel<number> | null = null

	const [_select_has_return_288e, _select_value_288e] = await $.selectStatement([
		{
			id: 0,
			isSend: true,
			channel: nilCh,
			value: 42,
			onSelected: async (result) => {
				console.log("ERROR: Should not send to nil channel")
			}
		},
		{
			id: 1,
			isSend: false,
			channel: nilCh,
			onSelected: async (result) => {
				console.log("ERROR: Should not receive from nil channel")
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("PASS: Default case executed correctly")
			}
		},
	], true)
	if (_select_has_return_288e) {
		return _select_value_288e!
	}
	// If _select_has_return_288e is false, continue execution

	// Test 2: Multiple nil channels in select with default
	console.log("\nTest 2: Select with multiple nil channels and default")
	let nilCh1: $.Channel<string> | null = null
	let nilCh2: $.Channel<string> | null = null

	const [_select_has_return_461c, _select_value_461c] = await $.selectStatement([
		{
			id: 0,
			isSend: true,
			channel: nilCh1,
			value: "test",
			onSelected: async (result) => {
				console.log("ERROR: Should not send to nil channel 1")
			}
		},
		{
			id: 1,
			isSend: false,
			channel: nilCh2,
			onSelected: async (result) => {
				console.log("ERROR: Should not receive from nil channel 2")
			}
		},
		{
			id: 2,
			isSend: false,
			channel: nilCh1,
			onSelected: async (result) => {
				const msg = result.value
				console.log("ERROR: Should not receive from nil channel 1:", msg)
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("PASS: Default case executed with multiple nil channels")
			}
		},
	], true)
	if (_select_has_return_461c) {
		return _select_value_461c!
	}
	// If _select_has_return_461c is false, continue execution

	// Test 3: Mix of nil and valid channels in select
	console.log("\nTest 3: Select with mix of nil and valid channels")
	let nilCh3: $.Channel<boolean> | null = null
	let validCh = $.makeChannel<boolean>(1, false, 'both')
	await $.chanSend(validCh, true)

	const [_select_has_return_c672, _select_value_c672] = await $.selectStatement([
		{
			id: 0,
			isSend: true,
			channel: nilCh3,
			value: true,
			onSelected: async (result) => {
				console.log("ERROR: Should not send to nil channel")
			}
		},
		{
			id: 1,
			isSend: false,
			channel: nilCh3,
			onSelected: async (result) => {
				console.log("ERROR: Should not receive from nil channel")
			}
		},
		{
			id: 2,
			isSend: false,
			channel: validCh,
			onSelected: async (result) => {
				const val = result.value
				console.log("PASS: Received from valid channel:", val)
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("ERROR: Should not hit default with valid channel ready")
			}
		},
	], true)
	if (_select_has_return_c672) {
		return _select_value_c672!
	}
	// If _select_has_return_c672 is false, continue execution

	console.log("\nAll nil channel tests completed")
}

