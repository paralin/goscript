// Generated file based on package_import_context.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as context from "@goscript/context/index.js"

export async function run(ctx: context.Context): Promise<void> {
	using __defer = new $.DisposableStack();
	let [sctx, sctxCancel] = context.WithCancel(ctx)
	__defer.defer(() => {
		sctxCancel!()
	});

	let myCh = $.makeChannel<{  }>(0, {}, 'both')

	queueMicrotask(async () => {
		await $.chanRecv(sctx!.Done())
		await $.chanSend(myCh, {})
	})

	// Check that myCh is not readable yet
	const [_select_has_return_cf1b, _select_value_cf1b] = await $.selectStatement([
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
	if (_select_has_return_cf1b) {
		return _select_value_cf1b!
	}
	// If _select_has_return_cf1b is false, continue execution

	// Cancel context which should trigger the goroutine
	sctxCancel!()

	// Now myCh should become readable
	await $.chanRecv(myCh)

	console.log("read successfully")
}

export async function main(): Promise<void> {
	let ctx = context.Background()
	await run(ctx)

	console.log("test finished")
}

