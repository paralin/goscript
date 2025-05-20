package main

func main() {
	// Basic type switch with variable and default case
	var i interface{} = "hello"
	switch v := i.(type) {
	case int:
		println("int", v)
	case string:
		println("string", v)
	default:
		println("unknown")
	}

	// Type switch without variable
	var x interface{} = 123
	switch x.(type) {
	case bool:
		println("bool")
	case int:
		println("int")
	}
	
	// Type switch with multiple types in a case
	var y interface{} = true
	switch v := y.(type) {
	case int, float64:
		println("number", v)
	case string, bool:
		println("string or bool", v)
	}
	
	// Type switch with initialization statement
	if z := getInterface(); true {
		switch v := z.(type) {
		case int:
			println("z is int", v)
		}
	}
	
	// Default-only type switch
	var w interface{} = "test"
	switch w.(type) {
	default:
		println("default only")
	}
}

func getInterface() interface{} {
	return 42
}
