package main

func main() {
	// Start an anonymous function worker
	msgs := make(chan string, 1)
	go func() {
		msgs <- "anonymous function worker"
	}()
	println(<-msgs)
}
