// Generated file based on package_import_context.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as context from "@goscript/context/index.js"

export async function main(): Promise<void> {
	await using __defer = new $.AsyncDisposableStack();
	let ctx = context.Background()
	let [sctx, sctxCancel] = context.WithCancel(ctx)
	__defer.defer(() => {
		sctxCancel!()
	});

	let myCh = $.makeChannel<{  }>(0, {}, 'both')

	queueMicrotask(async () => {
		await sctx.Done().receive()
		await myCh.send({})
	})

	// Check that myCh is not readable yet
	await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: myCh,
			onSelected: async (result) => {
				console.log("myCh should not be readable yet")
			}
		},
		{
			id: -1,
			isSend: false,
			channel: null,
			onSelected: async (result) => {
				console.log("myCh is not be readable yet")
			}
		},
	], true)

	// Cancel context which should trigger the goroutine
	sctxCancel!()

	// Now myCh should become readable
	await myCh.receive()

	console.log("read successfully")
}

