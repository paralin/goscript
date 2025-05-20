package main

import (
	"context"
	"sync"
	"time"

	"github.com/aperturerobotics/util/csync"
)

func main() {
	var (
		mtx     csync.Mutex
		counter int
		wg      sync.WaitGroup
	)

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	// Number of goroutines to spawn
	numWorkers := 5
	wg.Add(numWorkers)

	// Function that will be run by each worker
	worker := func(id int) {
		defer wg.Done()

		// Try to acquire the lock
		relLock, err := mtx.Lock(ctx)
		if err != nil {
			println("worker", id, "failed to acquire lock:", err.Error())
			return
		}
		defer relLock()

		// Critical section
		println("worker", id, "entered critical section")
		current := counter
		time.Sleep(100 * time.Millisecond) // Simulate work
		counter = current + 1
		println("worker", id, "incremented counter to", counter)
	}

	// Start worker goroutines
	for i := 0; i < numWorkers; i++ {
		go worker(i)
	}

	// Wait for all workers to complete or context timeout
	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
		println("All workers completed successfully")
	case <-ctx.Done():
		println("Test timed out:", ctx.Err().Error())
	}

	println("Final counter value:", counter)
	if counter != numWorkers {
		panic("counter does not match expected value")
	}

	println("success: csync.Mutex test completed")
}
