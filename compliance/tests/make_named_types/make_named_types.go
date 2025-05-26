package main

func main() {
	// Test make() calls with named types as the first argument
	// This tests the compiler's ability to handle make() with type aliases/named types
	// rather than direct type expressions like []int or map[string]int

	type MySlice []int
	var s MySlice = make(MySlice, 5)
	println("Length:", len(s))

	// Test make() with named map type
	type MyMap map[string]int
	var m MyMap = make(MyMap)
	m["test"] = 42
	println("Value:", m["test"])
}
