package main

func main() {
	// Test nil channel operations

	// Test 1: Using nil channel in select with default
	println("Test 1: Select with nil channel and default")
	var nilCh chan int

	select {
	case nilCh <- 42:
		println("ERROR: Should not send to nil channel")
	case <-nilCh:
		println("ERROR: Should not receive from nil channel")
	default:
		println("PASS: Default case executed correctly")
	}

	// Test 2: Multiple nil channels in select with default
	println("\nTest 2: Select with multiple nil channels and default")
	var nilCh1 chan string
	var nilCh2 chan string

	select {
	case nilCh1 <- "test":
		println("ERROR: Should not send to nil channel 1")
	case <-nilCh2:
		println("ERROR: Should not receive from nil channel 2")
	case msg := <-nilCh1:
		println("ERROR: Should not receive from nil channel 1:", msg)
	default:
		println("PASS: Default case executed with multiple nil channels")
	}

	// Test 3: Mix of nil and valid channels in select
	println("\nTest 3: Select with mix of nil and valid channels")
	var nilCh3 chan bool
	validCh := make(chan bool, 1)
	validCh <- true

	select {
	case nilCh3 <- true:
		println("ERROR: Should not send to nil channel")
	case <-nilCh3:
		println("ERROR: Should not receive from nil channel")
	case val := <-validCh:
		println("PASS: Received from valid channel:", val)
	default:
		println("ERROR: Should not hit default with valid channel ready")
	}

	println("\nAll nil channel tests completed")
}
