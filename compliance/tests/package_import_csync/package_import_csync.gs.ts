// Generated file based on package_import_csync.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

import * as context from "@goscript/context/index.js"

import * as sync from "@goscript/sync/index.js"

import * as time from "@goscript/time/index.js"

import * as csync from "@goscript/github.com/aperturerobotics/util/csync/index.js"

export async function main(): Promise<void> {
	await using __defer = new $.AsyncDisposableStack();
	let mtx: Mutex = new Mutex()
	let counter: number = 0
	let wg: WaitGroup = new WaitGroup()

	let [ctx, cancel] = context.WithTimeout(context.Background(), 5 * time.Second)
	__defer.defer(() => {
		cancel!()});

	// Number of goroutines to spawn
	let numWorkers = 5
	wg.Add(numWorkers)

	// Function that will be run by each worker

	// Try to acquire the lock

	// Critical section

	// Simulate work
	let worker = (id: number): void => {
		using __defer = new $.DisposableStack();
		__defer.defer(() => {
			wg.Done()});

		// Try to acquire the lock
		let [relLock, err] = mtx.Lock(ctx)
		if (err != null) {
			console.log("worker", id, "failed to acquire lock:", err.Error())
			return 
		}
		__defer.defer(() => {
			relLock()});

		// Critical section
		console.log("worker", id, "entered critical section")
		let current = counter
		time.Sleep(100 * time.Millisecond) // Simulate work
		counter = current + 1
		console.log("worker", id, "incremented counter to", counter)
	}


	// Start worker goroutines
	for (let i = 0; i < numWorkers; i++) {
		queueMicrotask(() => {
			worker(i)
		})
	}

	// Wait for all workers to complete or context timeout
	let done = $.makeChannel<{  }>(0, {}, 'both')
	queueMicrotask(() => {
		wg.Wait()
		done.close()
	})

	await $.selectStatement([
		{
			id: 0,
			isSend: false,
			channel: done,
			onSelected: async (result) => {
				console.log("All workers completed successfully")
			}
		},
		{
			id: 1,
			isSend: false,
			channel: ctx.Done(),
			onSelected: async (result) => {
				console.log("Test timed out:", ctx.Err().Error())
			}
		},
	], false)

	console.log("Final counter value:", counter)
	if (counter != numWorkers) {
		panic("counter does not match expected value")
	}

	console.log("success: csync.Mutex test completed")
}

