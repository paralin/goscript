package main

func main() {
	var i interface{}
	i = map[string]int{"age": 30}

	m, ok := i.(map[string]int)
	if ok {
		println("Age:", m["age"])
	} else {
		println("Type assertion failed")
	}

	_, ok2 := i.(map[string]string) // Different value type
	if ok2 {
		// This block should not be reached if the assertion fails as expected.
		// Depending on how Go handles failed assertions with incorrect types,
		// accessing n["key"] might panic if n is nil.
		// For safety and clarity, we'll just print a generic message if it passes unexpectedly.
		println("Unexpected success for map[string]string assertion")
	} else {
		println("Second type assertion (map[string]string) failed as expected")
	}

	_, ok3 := i.(map[int]int) // Different key type
	if ok3 {
		// Similar to the above, this block should not be reached.
		println("Unexpected success for map[int]int assertion")
	} else {
		println("Third type assertion (map[int]int) failed as expected")
	}
}
