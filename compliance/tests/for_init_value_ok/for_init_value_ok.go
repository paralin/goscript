package main

func main() {
	m := make(map[string]int)
	m["key1"] = 10
	m["key2"] = 20

	// This should trigger the compiler error: for loop initialization with value, ok pattern
	for value, ok := m["key1"]; ok; {
		println("value:", value)
		break
	}

	// Another case that might trigger the error
	for v, exists := m["key2"]; exists && v > 0; {
		println("v:", v)
		break
	}
}
