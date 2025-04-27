package main

func main() {
	ch := make(chan bool)

	defer func() {
		println("deferred start")
		<-ch // Wait for signal from main
		println("deferred end")
	}()

	println("main start")
	println("main signaling defer")
	ch <- true // Signal the deferred function
	println("main end")
}
