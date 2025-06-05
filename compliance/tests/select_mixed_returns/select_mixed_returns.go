package main

import (
	"context"
	"time"
)

func testMixedReturns(ctx context.Context) string {
	ch1 := make(chan string, 1)
	ch2 := make(chan int, 1)
	ch3 := make(chan bool, 1)
	ch4 := make(chan float64, 1)
	ch5 := make(chan []byte, 1)

	// Pre-populate only one channel to make the test deterministic
	ch2 <- 42

	select {
	case <-ctx.Done():
		println("Context done, returning")
		return "context_done"
	case msg := <-ch1:
		// Case 1: Return with result
		println("Received from ch1:", msg)
		return "ch1_result"
	case num := <-ch2:
		// Case 2: No return, just print and continue
		println("Received from ch2:", num)
		println("Processing ch2 value...")
	case flag := <-ch3:
		// Case 3: Return with result
		println("Received from ch3:", flag)
		return "ch3_result"
	case val := <-ch4:
		// Case 4: No return, just print and continue
		println("Received from ch4:", val)
		println("Processing ch4 value...")
	case <-ch5:
		// Case 5: No return, just print and continue
		println("Received from ch5")
		println("Processing ch5 data...")
	default:
		// Default case: No return, just print and continue
		println("No channels ready, using default")
	}

	// This code should execute when cases 2, 4, 5, or default are selected
	println("Continuing execution after select")
	println("Performing additional work...")

	// Simulate some work
	time.Sleep(10 * time.Millisecond)

	return "completed_normally"
}

func testReturnCase(ctx context.Context) string {
	ch1 := make(chan string, 1)
	ch2 := make(chan int, 1)
	ch3 := make(chan bool, 1)
	ch4 := make(chan float64, 1)
	ch5 := make(chan []byte, 1)

	// Pre-populate ch1 to trigger a returning case
	ch1 <- "test_message"

	select {
	case msg := <-ch1:
		// Case 1: Return with result
		println("Received from ch1:", msg)
		return "ch1_result"
	case num := <-ch2:
		// Case 2: No return, just print and continue
		println("Received from ch2:", num)
		println("Processing ch2 value...")
	case flag := <-ch3:
		// Case 3: Return with result
		println("Received from ch3:", flag)
		return "ch3_result"
	case val := <-ch4:
		// Case 4: No return, just print and continue
		println("Received from ch4:", val)
		println("Processing ch4 value...")
	case <-ch5:
		// Case 5: No return, just print and continue
		println("Received from ch5")
		println("Processing ch5 data...")
	default:
		// Default case: No return, just print and continue
		println("No channels ready, using default")
	}

	// This code should NOT execute for ch1 case (which returns)
	println("Continuing execution after select")
	println("Performing additional work...")

	// Simulate some work
	time.Sleep(10 * time.Millisecond)

	return "completed_normally"
}

func main() {
	ctx := context.Background()

	println("Test 1: Non-returning case (ch2)")
	result1 := testMixedReturns(ctx)
	println("Final result:", result1)

	println()
	println("Test 2: Returning case (ch1)")
	result2 := testReturnCase(ctx)
	println("Final result:", result2)

	println()
	println("All tests completed")
}
