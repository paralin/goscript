package main

func main() {
	ch := make(chan int)
	go func() {
		ch <- 1
		close(ch) // Close the channel to allow the main goroutine to exit
	}()
	<-ch            // Discard the value received from the channel
	println("done") // Add a print statement to verify execution
}
