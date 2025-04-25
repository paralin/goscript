package main

// This function receives from a channel, making it async.
func receiveFromChan(ch chan int) int {
	val := <-ch // This operation makes the function async
	return val
}

// This function calls an async function, making it async too.
func caller(ch chan int) int {
	// We expect this call to be awaited in TypeScript
	result := receiveFromChan(ch)
	return result + 1
}

func main() {
	// Create a buffered channel
	myChan := make(chan int, 1)
	myChan <- 10 // Send a value

	// Call the async caller function
	finalResult := caller(myChan)
	println(finalResult) // Expected output: 11

	close(myChan)
}
