package main

func main() {
	// Test 1: Simple deterministic select with default
	// Create a buffered channel so sends don't block
	ch1 := make(chan string, 1)

	// First test: empty channel, should hit default
	select {
	case msg := <-ch1:
		println("TEST1: Received unexpected value:", msg)
	default:
		println("TEST1: Default case hit correctly")
	}

	// Now put something in the channel
	ch1 <- "hello"

	// Second test: should read from channel
	select {
	case msg := <-ch1:
		println("TEST2: Received expected value:", msg)
	default:
		println("TEST2: Default case hit unexpectedly")
	}

	// Test 3: Select with channel closing and ok value
	ch2 := make(chan int, 1)
	ch2 <- 42
	close(ch2)

	// First receive gets the buffered value
	select {
	case val, ok := <-ch2:
		if ok {
			println("TEST3: Received buffered value with ok==true:", val)
		} else {
			println("TEST3: Unexpected ok==false")
		}
	default:
		println("TEST3: Default hit unexpectedly")
	}

	// Second receive gets the zero value with ok==false
	select {
	case val, ok := <-ch2:
		if ok {
			println("TEST4: Unexpected ok==true:", val)
		} else {
			println("TEST4: Received zero value with ok==false:", val)
		}
	default:
		println("TEST4: Default hit unexpectedly")
	}

	// Test 5: Send operations
	ch3 := make(chan int, 1)

	// First send should succeed (buffer not full)
	select {
	case ch3 <- 5:
		println("TEST5: Sent value successfully")
	default:
		println("TEST5: Default hit unexpectedly")
	}

	// Second send should hit default (buffer full)
	select {
	case ch3 <- 10:
		println("TEST6: Sent unexpectedly")
	default:
		println("TEST6: Default hit correctly (channel full)")
	}

	// Test 7: Multiple channel select (with known values)
	ch4 := make(chan string, 1)
	ch5 := make(chan string, 1)

	ch4 <- "from ch4"

	// Should select ch4 because it has data, ch5 is empty
	select {
	case msg := <-ch4:
		println("TEST7: Selected ch4 correctly:", msg)
	case msg := <-ch5:
		println("TEST7: Selected ch5 unexpectedly:", msg)
	}

	// Now ch4 is empty and ch5 is empty
	ch5 <- "from ch5"

	// Should select ch5 because it has data, ch4 is empty
	select {
	case msg := <-ch4:
		println("TEST8: Selected ch4 unexpectedly:", msg)
	case msg := <-ch5:
		println("TEST8: Selected ch5 correctly:", msg)
	}

	// Test 9: Channel closing test case for a separate test
	chClose := make(chan bool)
	close(chClose)
	val, ok := <-chClose
	if !ok {
		println("TEST9: Channel is closed, ok is false, val:", val)
	} else {
		println("TEST9: Channel reports as not closed")
	}
}
