package main

func main() {
	ch := make(chan int) // Unbuffered
	close(ch)

	select { //nolint:staticcheck
	case val, ok := <-ch:
		if ok {
			println("Received value with ok==true:", val) // Should not be reached
		} else {
			println("Received zero value with ok==false:", val) // Should be reached
		}
	}
}
