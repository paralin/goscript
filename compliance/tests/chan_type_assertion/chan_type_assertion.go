package main

func main() {
	var c1 chan int
	var c2 chan<- int
	var c3 <-chan int
	var c4 chan bool

	var i interface{} = c1
	_, ok1 := i.(chan int)
	println(ok1)

	_, ok2 := i.(chan<- int)
	println(ok2)

	_, ok3 := i.(<-chan int)
	println(ok3)

	i = c2
	_, ok5 := i.(chan int)
	println(ok5)
	_, ok6 := i.(chan<- int)
	println(ok6)
	_, ok7 := i.(<-chan int)
	println(ok7)

	i = c3
	_, ok8 := i.(chan int)
	println(ok8)
	_, ok9 := i.(chan<- int)
	println(ok9)
	_, ok10 := i.(<-chan int)
	println(ok10)

	// Test with nil channel
	var cnil chan string
	i = cnil
	_, ok11 := i.(chan string)
	println(ok11)
	_, ok12 := i.(chan int)
	println(ok12)

	// Test with a non-channel type
	var s string = "hello"
	i = s
	_, ok13 := i.(chan int)
	println(ok13)

	i = c4
	_, ok14 := i.(chan bool)
	println(ok14)
	_, ok15 := i.(chan int)
	println(ok15)
}
