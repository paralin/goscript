package main

func main() {
	ch1 := make(chan int)       // bidirectional int channel
	ch2 := make(chan<- string)  // send-only string channel
	ch3 := make(<-chan float64) // receive-only float64 channel
	ch4 := make(chan struct{})  // bidirectional struct{} channel

	var i interface{} = ch1
	if _, ok := i.(chan int); ok {
		println("i is chan int: ok")
	} else {
		println("i is chan int: failed")
	}

	var s interface{} = ch2
	if _, ok := s.(chan<- string); ok {
		println("s is chan<- string: ok")
	} else {
		println("s is chan<- string: failed")
	}

	var r interface{} = ch3
	if _, ok := r.((<-chan float64)); ok {
		println("r is <-chan float64: ok")
	} else {
		println("r is <-chan float64: failed")
	}

	var e interface{} = ch4
	if _, ok := e.(chan struct{}); ok {
		println("e is chan struct{}: ok")
	} else {
		println("e is chan struct{}: failed")
	}

	if _, ok := i.(chan string); ok {
		println("i is chan string: incorrect")
	} else {
		println("i is chan string: correctly failed")
	}

	if _, ok := i.(chan<- int); ok {
		println("i is chan<- int: incorrect")
	} else {
		println("i is chan<- int: correctly failed")
	}

	if _, ok := i.(<-chan int); ok {
		println("i is <-chan int: incorrect")
	} else {
		println("i is <-chan int: correctly failed")
	}

	if _, ok := i.(chan<- int); ok {
		println("bidirectional can be used as send-only: ok")
	} else {
		println("bidirectional can be used as send-only: failed")
	}

	if _, ok := i.(<-chan int); ok {
		println("bidirectional can be used as receive-only: ok")
	} else {
		println("bidirectional can be used as receive-only: failed")
	}
}
