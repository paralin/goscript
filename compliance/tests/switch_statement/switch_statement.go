package main

func main() {
	i := 2
	println("Integer switch:")
	switch i {
	case 1:
		println("one")
	case 2:
		println("two")
	case 3:
		println("three")
	default:
		println("other integer")
	}

	s := "hello"
	println("\nString switch:")
	switch s {
	case "world":
		println("world")
	case "hello":
		println("hello")
	default:
		println("other string")
	}
}
