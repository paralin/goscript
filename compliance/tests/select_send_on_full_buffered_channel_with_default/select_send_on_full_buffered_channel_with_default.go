package main

func main() {
	ch := make(chan int, 1)
	ch <- 1 // Fill the buffer

	// TODO: The comments on the following cases are written twice in the output.
	select {
	case ch <- 2:
		println("Sent value") // Should not be reached
	default:
		println("Default case hit") // Should be reached
	}
}
