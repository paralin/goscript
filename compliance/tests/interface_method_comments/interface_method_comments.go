package main

type MyInterface interface {
	// MyMethod is a method with a comment
	MyMethod()
}

func main() {
	// This test verifies that comments on interface methods are preserved.
	println("Test started")
	// No actual execution needed, just compilation check.
	println("Test finished")
}
