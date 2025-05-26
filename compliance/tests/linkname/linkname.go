package main

import (
	"os"
	_ "unsafe"
)

//go:linkname osOpen os.Open
func osOpen(name string) (*os.File, error)

func main() {
	// Test basic os package functionality
	file, err := os.Open("/dev/null")
	if err != nil {
		println("error opening file:", err.Error())
		return
	}
	defer file.Close()

	// Test the linkname function - this should be equivalent to os.Open
	file2, err2 := osOpen("/dev/null")
	if err2 != nil {
		println("error opening file with linkname:", err2.Error())
		return
	}
	defer file2.Close()

	println("linkname directive compiled successfully")
	println("test finished")
}
