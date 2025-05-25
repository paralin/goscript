package main

func main() {
	ch := make(chan int, 1)

	// Send a value to the channel
	ch <- 42

	// Receive with both value and ok discarded
	_, _ = <-ch

	println("received and discarded value and ok")

	// Close the channel
	close(ch)

	// Receive from closed channel with both discarded
	_, _ = <-ch

	println("received from closed channel, both discarded")
}
