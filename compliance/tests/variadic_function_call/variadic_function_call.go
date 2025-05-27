package main

import "errors"

// TestFS simulates the function signature from the user's example
func TestFS(fsys string, expected ...string) error {
	return testFS(fsys, expected...)
}

// testFS is the variadic function being called
func testFS(fsys string, expected ...string) error {
	if len(expected) == 0 {
		return errors.New("no expected values")
	}

	for i, exp := range expected {
		println("Expected[" + string(rune(i+'0')) + "]: " + exp)
	}

	println("File system: " + fsys)
	return nil
}

func main() {
	expected := []string{"file1.txt", "file2.txt", "file3.txt"}

	// This is the problematic line - should generate spread syntax in TypeScript
	err := TestFS("myfs", expected...)

	if err != nil {
		println("Error: " + err.Error())
	} else {
		println("Success!")
	}
}
