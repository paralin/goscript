package main

func main() {
	// Test reserved word conflicts that cause TypeScript compilation errors
	// This reproduces the "let new: number = 0" error we saw
	var new int = 42
	var class string = "test"
	var typeof bool = true

	println("new:", new)
	println("class:", class)
	println("typeof:", typeof)

	// Test function with named return that uses reserved word
	result := testNamedReturn()
	println("named return result:", result)

	println("test finished")
}

func testNamedReturn() (new int) {
	new = 100
	return
}
