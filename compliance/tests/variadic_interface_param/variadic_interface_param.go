package main

// testVariadicInterface tests the TypeScript generation for functions
// with variadic ...interface{} parameters
func testVariadicInterface(name string, values ...interface{}) {
	println("Name:", name)
	println("Values count:", len(values))
	for i, v := range values {
		// We can't do much with interface{} values in the compiled output
		// but we can at least check they're passed correctly
		if v != nil {
			println("Value", i, "is not nil")
		} else {
			println("Value", i, "is nil")
		}
	}
}

func main() {
	// Test with various argument types
	testVariadicInterface("test1", "hello", 42, true)
	testVariadicInterface("test2", nil, "world")
	testVariadicInterface("test3")

	// Test with slice expansion
	values := []interface{}{"a", "b", "c"}
	testVariadicInterface("test4", values...)
}
