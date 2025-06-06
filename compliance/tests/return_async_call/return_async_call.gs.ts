// Generated file based on return_async_call.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as context from "@goscript/context/index.js"

import * as time from "@goscript/time/index.js"

// AsyncFunction simulates an async function
export async function AsyncFunction(): Promise<string> {
	await time.Sleep(10 * time.Millisecond)
	return "result"
}

// SyncWrapper directly returns result of async function - should be async
export async function SyncWrapper(): Promise<string> {
	return await AsyncFunction()
}

// AnotherAsyncFunction simulates another async function
export async function AnotherAsyncFunction(ctx: context.Context): Promise<[string, $.GoError]> {
	await time.Sleep(5 * time.Millisecond)
	return ["async result", null]
}

// WrapperWithError directly returns result of async function with error - should be async
export async function WrapperWithError(ctx: context.Context): Promise<[string, $.GoError]> {
	return await AnotherAsyncFunction(ctx)
}

export async function main(): Promise<void> {
	// These calls should work properly with async/await
	let result1 = await SyncWrapper()
	console.log("Result1:", result1)

	let ctx = context.Background()
	let [result2, err] = await WrapperWithError(ctx)
	if (err != null) {
		console.log("Error:", err!.Error())
		return 
	}
	console.log("Result2:", result2)
}

