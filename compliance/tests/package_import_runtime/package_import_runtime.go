package main

import "runtime"

func main() {
	// Test basic runtime functions
	println("GOOS:", runtime.GOOS)
	println("GOARCH:", runtime.GOARCH)
	// println("Version:", runtime.Version()) - not stable for the test (go.mod may change)
	println("NumCPU:", runtime.NumCPU())

	// Test GOMAXPROCS
	procs := runtime.GOMAXPROCS(0) // Get current value
	println("GOMAXPROCS(-1):", runtime.GOMAXPROCS(-1))
	println("GOMAXPROCS(0):", procs)

	// Test NumGoroutine
	println("NumGoroutine:", runtime.NumGoroutine())

	// Test GC (should be no-op)
	runtime.GC()
	println("GC called successfully")
}
