// Generated file based on package_import_runtime.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as runtime from "@goscript/runtime/index.js"

export async function main(): Promise<void> {
	// Test basic runtime functions
	console.log("GOOS:", runtime.GOOS)

	// println("Version:", runtime.Version()) - not stable for the test (go.mod may change)
	// println("NumCPU:", runtime.NumCPU()) - not stable for the test (number of cores may change)
	console.log("GOARCH:", runtime.GOARCH)

	// Test GOMAXPROCS
	let procs = runtime.GOMAXPROCS(0) // Get current value
	console.log("GOMAXPROCS(-1):", runtime.GOMAXPROCS(-1))
	console.log("GOMAXPROCS(0):", procs)

	// Test NumGoroutine
	console.log("NumGoroutine:", runtime.NumGoroutine())

	// Test GC (should be no-op)
	runtime.GC()
	console.log("GC called successfully")
}

