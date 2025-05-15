// Generated file based on goroutines.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

let done: $.Channel<boolean> = $.makeChannel<boolean>(0, false, 'both')

// A worker function that will be called as a goroutine
async function worker(id: number): Promise<void> {
	console.log("Worker", id, "starting")
	console.log("Worker", id, "done")
	await done.send(true)
}

// Another worker function to test multiple different goroutines
async function anotherWorker(name: string): Promise<void> {
	console.log("Another worker:", name)
	await done.send(true)
}

export async function main(): Promise<void> {
	console.log("Main: Starting workers")

	// Count of goroutines to wait for
	let totalGoroutines = 5

	// This will cause the error because we're using a named function
	// instead of an inline function literal

	// This will trigger the error with *ast.Ident
	for (let i = 0; i < 3; i++) {
