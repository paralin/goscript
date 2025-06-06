// Generated file based on select_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Test 1: Simple deterministic select with default
	// Create a buffered channel so sends don't block
	let ch1 = $.makeChannel<string>(1, "", 'both')

	// First test: empty channel, should hit default
	const [_select_has_return_4a57, _select_value_4a57] = await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: ch1,
			onSelected: async (result) => {
				const msg = result.value
				console.log("TEST1: Received unexpected value:", msg)
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("TEST1: Default case hit correctly")
			}
		},
	], true)
	if (_select_has_return_4a57) {
		return _select_value_4a57!
	}
	// If _select_has_return_4a57 is false, continue execution

	// Now put something in the channel
	await $.chanSend(ch1, "hello")

	// Second test: should read from channel
	const [_select_has_return_b3b0, _select_value_b3b0] = await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: ch1,
			onSelected: async (result) => {
				const msg = result.value
				console.log("TEST2: Received expected value:", msg)
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("TEST2: Default case hit unexpectedly")
			}
		},
	], true)
	if (_select_has_return_b3b0) {
		return _select_value_b3b0!
	}
	// If _select_has_return_b3b0 is false, continue execution

	// Test 3: Select with channel closing and ok value
	let ch2 = $.makeChannel<number>(1, 0, 'both')
	await $.chanSend(ch2, 42)
	ch2.close()

	// First receive gets the buffered value
	const [_select_has_return_1cea, _select_value_1cea] = await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: ch2,
			onSelected: async (result) => {
				const val = result.value
				const ok = result.ok
				if (ok) {
					console.log("TEST3: Received buffered value with ok==true:", val)
				}
				 else {
					console.log("TEST3: Unexpected ok==false")
				}
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("TEST3: Default hit unexpectedly")
			}
		},
	], true)
	if (_select_has_return_1cea) {
		return _select_value_1cea!
	}
	// If _select_has_return_1cea is false, continue execution

	// Second receive gets the zero value with ok==false
	const [_select_has_return_e25c, _select_value_e25c] = await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: ch2,
			onSelected: async (result) => {
				const val = result.value
				const ok = result.ok
				if (ok) {
					console.log("TEST4: Unexpected ok==true:", val)
				}
				 else {
					console.log("TEST4: Received zero value with ok==false:", val)
				}
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("TEST4: Default hit unexpectedly")
			}
		},
	], true)
	if (_select_has_return_e25c) {
		return _select_value_e25c!
	}
	// If _select_has_return_e25c is false, continue execution

	// Test 5: Send operations
	let ch3 = $.makeChannel<number>(1, 0, 'both')

	// First send should succeed (buffer not full)
	const [_select_has_return_79d6, _select_value_79d6] = await $.selectStatement([
		{
			id: 0,
			isSend: true,
			channel: ch3,
			value: 5,
			onSelected: async (result) => {
				console.log("TEST5: Sent value successfully")
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("TEST5: Default hit unexpectedly")
			}
		},
	], true)
	if (_select_has_return_79d6) {
		return _select_value_79d6!
	}
	// If _select_has_return_79d6 is false, continue execution

	// Second send should hit default (buffer full)
	const [_select_has_return_692f, _select_value_692f] = await $.selectStatement([
		{
			id: 0,
			isSend: true,
			channel: ch3,
			value: 10,
			onSelected: async (result) => {
				console.log("TEST6: Sent unexpectedly")
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("TEST6: Default hit correctly (channel full)")
			}
		},
	], true)
	if (_select_has_return_692f) {
		return _select_value_692f!
	}
	// If _select_has_return_692f is false, continue execution

	// Test 7: Multiple channel select (with known values)
	let ch4 = $.makeChannel<string>(1, "", 'both')
	let ch5 = $.makeChannel<string>(1, "", 'both')

	await $.chanSend(ch4, "from ch4")

	// Should select ch4 because it has data, ch5 is empty
	const [_select_has_return_e661, _select_value_e661] = await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: ch4,
			onSelected: async (result) => {
				const msg = result.value
				console.log("TEST7: Selected ch4 correctly:", msg)
			}
		},
		{
			id: 1,
			isSend: false,
			channel: ch5,
			onSelected: async (result) => {
				const msg = result.value
				console.log("TEST7: Selected ch5 unexpectedly:", msg)
			}
		},
	], false)
	if (_select_has_return_e661) {
		return _select_value_e661!
	}
	// If _select_has_return_e661 is false, continue execution

	// Now ch4 is empty and ch5 is empty
	await $.chanSend(ch5, "from ch5")

	// Should select ch5 because it has data, ch4 is empty
	const [_select_has_return_e25d, _select_value_e25d] = await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: ch4,
			onSelected: async (result) => {
				const msg = result.value
				console.log("TEST8: Selected ch4 unexpectedly:", msg)
			}
		},
		{
			id: 1,
			isSend: false,
			channel: ch5,
			onSelected: async (result) => {
				const msg = result.value
				console.log("TEST8: Selected ch5 correctly:", msg)
			}
		},
	], false)
	if (_select_has_return_e25d) {
		return _select_value_e25d!
	}
	// If _select_has_return_e25d is false, continue execution

	// Test 9: Channel closing test case for a separate test
	let chClose = $.makeChannel<boolean>(0, false, 'both')
	chClose.close()
	const { value: val, ok: ok } = await $.chanRecvWithOk(chClose)
	if (!ok) {
		console.log("TEST9: Channel is closed, ok is false, val:", val)
	}
	 else {
		console.log("TEST9: Channel reports as not closed")
	}
}

