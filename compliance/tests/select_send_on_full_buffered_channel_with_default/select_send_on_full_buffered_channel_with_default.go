package main

func main() {
	ch := make(chan int, 1)
	ch <- 1 // Fill the buffer

	select {
	case ch <- 2:
		println("Sent value") // Should not be reached
	default:
		println("Default case hit") // Should be reached
	}
}
