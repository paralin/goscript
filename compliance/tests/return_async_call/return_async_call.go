package main

import (
	"context"
	"time"
)

// AsyncFunction simulates an async function
func AsyncFunction() string {
	time.Sleep(10 * time.Millisecond)
	return "result"
}

// SyncWrapper directly returns result of async function - should be async
func SyncWrapper() string {
	return AsyncFunction()
}

// AnotherAsyncFunction simulates another async function
func AnotherAsyncFunction(ctx context.Context) (string, error) {
	time.Sleep(5 * time.Millisecond)
	return "async result", nil
}

// WrapperWithError directly returns result of async function with error - should be async
func WrapperWithError(ctx context.Context) (string, error) {
	return AnotherAsyncFunction(ctx)
}

func main() {
	// These calls should work properly with async/await
	result1 := SyncWrapper()
	println("Result1:", result1)

	ctx := context.Background()
	result2, err := WrapperWithError(ctx)
	if err != nil {
		println("Error:", err.Error())
		return
	}
	println("Result2:", result2)
}
