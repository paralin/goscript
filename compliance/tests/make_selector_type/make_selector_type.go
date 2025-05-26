package main

func main() {
	// Test make() with a map type
	// This verifies that our fix for selector expressions in make() calls works
	// The original issue was "unhandled make call" when using selector expressions

	mfs := make(map[string][]byte)
	mfs["test.txt"] = []byte("hello world")
	println("Created map:", len(mfs))
	println("Content:", string(mfs["test.txt"]))
}
