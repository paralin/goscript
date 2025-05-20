package main

func main() {
	var i interface{} = "hello"
	switch v := i.(type) {
	case int:
		println("int", v)
	case string:
		println("string", v)
	default:
		println("unknown")
	}

	var x interface{} = 123
	switch x.(type) {
	case bool:
		println("bool")
	case int:
		println("int")
	}
}
