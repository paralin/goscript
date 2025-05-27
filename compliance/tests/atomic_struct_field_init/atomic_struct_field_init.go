package main

import "sync/atomic"

type MyStruct struct {
	closed atomic.Bool
	count  atomic.Int32
	flag   atomic.Uint32
}

func main() {
	// Test struct initialization with atomic fields
	s := MyStruct{}

	// Test that the atomic fields work correctly
	s.closed.Store(true)
	s.count.Store(42)
	s.flag.Store(100)

	println("closed:", s.closed.Load())
	println("count:", s.count.Load())
	println("flag:", s.flag.Load())

	// Test struct initialization with init values
	s2 := MyStruct{
		closed: atomic.Bool{},
		count:  atomic.Int32{},
		flag:   atomic.Uint32{},
	}

	s2.closed.Store(false)
	s2.count.Store(24)
	s2.flag.Store(50)

	println("s2 closed:", s2.closed.Load())
	println("s2 count:", s2.count.Load())
	println("s2 flag:", s2.flag.Load())

	println("atomic struct field test finished")
}
