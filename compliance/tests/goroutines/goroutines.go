// Package main tests goroutine handling with named functions
package main

// A channel to synchronize goroutines
var done = make(chan bool)

// A worker function that will be called as a goroutine
func worker(id int) {
	println("Worker", id, "starting")
	println("Worker", id, "done")
	done <- true
}

// Another worker function to test multiple different goroutines
func anotherWorker(name string) {
	println("Another worker:", name)
	done <- true
}

func main() {
	println("Main: Starting workers")

	// Count of goroutines to wait for
	totalGoroutines := 5 // 3 workers + 1 anotherWorker + 1 anonymous function
	
	// This will cause the error because we're using a named function
	// instead of an inline function literal
	for i := 0; i < 3; i++ {
		go worker(i) // This will trigger the error with *ast.Ident
	}

	// Try calling another worker function as a goroutine
	go anotherWorker("test")

	// This works in the current implementation because it's a function literal
	go func() {
		println("Anonymous function worker")
		done <- true
	}()

	println("Main: Workers started")
	
	// Use channels to wait for all goroutines to complete
	for i := 0; i < totalGoroutines; i++ {
		<-done
	}
	
	println("Main: All workers completed")
}
