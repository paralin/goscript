// Generated file based on select_mixed_returns.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as context from "@goscript/context/index.js"

import * as time from "@goscript/time/index.js"

export async function testMixedReturns(ctx: context.Context): Promise<string> {
	let ch1 = $.makeChannel<string>(1, "", 'both')
	let ch2 = $.makeChannel<number>(1, 0, 'both')
	let ch3 = $.makeChannel<boolean>(1, false, 'both')
	let ch4 = $.makeChannel<number>(1, 0, 'both')
	let ch5 = $.makeChannel<$.Bytes>(1, new Uint8Array(0), 'both')

	// Pre-populate only one channel to make the test deterministic
	await $.chanSend(ch2, 42)

	// Case 1: Return with result

	// Case 2: No return, just print and continue

	// Case 3: Return with result

	// Case 4: No return, just print and continue

	// Case 5: No return, just print and continue

	// Default case: No return, just print and continue
	const [_select_has_return_db2a, _select_value_db2a] = await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: ctx!.Done(),
			onSelected: async (result) => {
				console.log("Context done, returning")
				return "context_done"
			}
		},
		{
			id: 1,
			isSend: false,
			channel: ch1,
			onSelected: async (result) => {
				const msg = result.value
				console.log("Received from ch1:", msg)
				return "ch1_result"
			}
		},
		{
			id: 2,
			isSend: false,
			channel: ch2,
			onSelected: async (result) => {
				const num = result.value
				console.log("Received from ch2:", num)
				console.log("Processing ch2 value...")
			}
		},
		{
			id: 3,
			isSend: false,
			channel: ch3,
			onSelected: async (result) => {
				const flag = result.value
				console.log("Received from ch3:", flag)
				return "ch3_result"
			}
		},
		{
			id: 4,
			isSend: false,
			channel: ch4,
			onSelected: async (result) => {
				const val = result.value
				console.log("Received from ch4:", val)
				console.log("Processing ch4 value...")
			}
		},
		{
			id: 5,
			isSend: false,
			channel: ch5,
			onSelected: async (result) => {
				console.log("Received from ch5")
				console.log("Processing ch5 data...")
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("No channels ready, using default")
			}
		},
	], true)
	if (_select_has_return_db2a) {
		return _select_value_db2a!
	}
	// If _select_has_return_db2a is false, continue execution

	// This code should execute when cases 2, 4, 5, or default are selected
	console.log("Continuing execution after select")
	console.log("Performing additional work...")

	// Simulate some work
	await time.Sleep(10 * time.Millisecond)

	return "completed_normally"
}

export async function testReturnCase(ctx: context.Context): Promise<string> {
	let ch1 = $.makeChannel<string>(1, "", 'both')
	let ch2 = $.makeChannel<number>(1, 0, 'both')
	let ch3 = $.makeChannel<boolean>(1, false, 'both')
	let ch4 = $.makeChannel<number>(1, 0, 'both')
	let ch5 = $.makeChannel<$.Bytes>(1, new Uint8Array(0), 'both')

	// Pre-populate ch1 to trigger a returning case
	await $.chanSend(ch1, "test_message")

	// Case 1: Return with result

	// Case 2: No return, just print and continue

	// Case 3: Return with result

	// Case 4: No return, just print and continue

	// Case 5: No return, just print and continue

	// Default case: No return, just print and continue
	const [_select_has_return_2dfa, _select_value_2dfa] = await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: ch1,
			onSelected: async (result) => {
				const msg = result.value
				console.log("Received from ch1:", msg)
				return "ch1_result"
			}
		},
		{
			id: 1,
			isSend: false,
			channel: ch2,
			onSelected: async (result) => {
				const num = result.value
				console.log("Received from ch2:", num)
				console.log("Processing ch2 value...")
			}
		},
		{
			id: 2,
			isSend: false,
			channel: ch3,
			onSelected: async (result) => {
				const flag = result.value
				console.log("Received from ch3:", flag)
				return "ch3_result"
			}
		},
		{
			id: 3,
			isSend: false,
			channel: ch4,
			onSelected: async (result) => {
				const val = result.value
				console.log("Received from ch4:", val)
				console.log("Processing ch4 value...")
			}
		},
		{
			id: 4,
			isSend: false,
			channel: ch5,
			onSelected: async (result) => {
				console.log("Received from ch5")
				console.log("Processing ch5 data...")
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("No channels ready, using default")
			}
		},
	], true)
	if (_select_has_return_2dfa) {
		return _select_value_2dfa!
	}
	// If _select_has_return_2dfa is false, continue execution

	// This code should NOT execute for ch1 case (which returns)
	console.log("Continuing execution after select")
	console.log("Performing additional work...")

	// Simulate some work
	await time.Sleep(10 * time.Millisecond)

	return "completed_normally"
}

export async function main(): Promise<void> {
	let ctx = context.Background()

	console.log("Test 1: Non-returning case (ch2)")
	let result1 = await testMixedReturns(ctx)
	console.log("Final result:", result1)

	console.log()
	console.log("Test 2: Returning case (ch1)")
	let result2 = await testReturnCase(ctx)
	console.log("Final result:", result2)

	console.log()
	console.log("All tests completed")
}

