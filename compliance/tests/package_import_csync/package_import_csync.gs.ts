// Generated file based on package_import_csync.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as context from "@goscript/context/index.js"

import * as sync from "@goscript/sync/index.js"

import * as time from "@goscript/time/index.js"

import * as csync from "@goscript/github.com/aperturerobotics/util/csync/index.js"

export async function main(): Promise<void> {
	await using __defer = new $.AsyncDisposableStack();
	let mtx: csync.Mutex = new csync.Mutex()
	let counter: number = 0
	let wg: sync.WaitGroup = new sync.WaitGroup()

	let [ctx, cancel] = context.WithTimeout(context.Background(), $.multiplyDuration(5, time.Second))
	__defer.defer(() => {
		cancel!()
	});

	// Number of goroutines to spawn
	let numWorkers = 5
	wg.Add(numWorkers)

	// Function that will be run by each worker

	// Try to acquire the lock

	// Critical section
	// println("worker", id, "entered critical section") - non-deterministic, leave commented out

	// Simulate work

	// println("worker", id, "incremented counter to", counter) - non-deterministic, leave commented out
	let worker = async (id: number): Promise<void> => {
		await using __defer = new $.AsyncDisposableStack();
		__defer.defer(() => {
			wg.Done()
		});

		// Try to acquire the lock
		let [relLock, err] = await await mtx.Lock(ctx)
		if (err != null) {
			console.log("worker", id, "failed to acquire lock:", err!.Error())
			return 
		}
		__defer.defer(() => {
			relLock!()
		});

		// Critical section
		// println("worker", id, "entered critical section") - non-deterministic, leave commented out
		let current = counter
		time.Sleep($.multiplyDuration(100, time.Millisecond)) // Simulate work

		// println("worker", id, "incremented counter to", counter) - non-deterministic, leave commented out
		counter = current + 1
		// println("worker", id, "incremented counter to", counter) - non-deterministic, leave commented out
	}

	// Start worker goroutines
	for (let i = 0; i < numWorkers; i++) {
		queueMicrotask(() => {
			worker(i)
		})
	}

	// Wait for all workers to complete or context timeout
	let done = $.makeChannel<{  }>(0, {}, 'both')
	queueMicrotask(async () => {
		await wg.Wait()
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
			channel: ctx!.Done(),
			onSelected: async (result) => {
				console.log("Test timed out:", ctx!.Err()!.Error())
			}
		},
	], false)

	console.log("Final counter value:", counter)
	if (counter != numWorkers) {
		$.panic("counter does not match expected value")
	}

	console.log("success: csync.Mutex test completed")
}

