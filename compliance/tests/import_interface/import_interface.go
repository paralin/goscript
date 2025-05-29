package main

import (
	"os"
	"path/filepath"
)

// This test is intended for checking the .gs.ts that is generated
// rather than the actual execution behavior or output.

// This test demonstrates the issue where os.FileInfo gets expanded
// to its full type definition instead of preserving the interface name
func walkFunction(path string, info os.FileInfo, walkFn filepath.WalkFunc) error {
	// Simple test function that takes os.FileInfo as parameter
	if info != nil {
		println("File:", info.Name())
	}
	_, _ = path, walkFn
	return nil
}

// Also test as a return type
func getFileInfo() (os.FileInfo, error) {
	return nil, nil
}

func main() {
	// Test os.FileInfo interface is preserved in function signatures
	println("Testing os.FileInfo interface preservation")
	walkFunction(".", nil, nil)

	info, err := getFileInfo()
	if err == nil && info != nil {
		println("Got FileInfo:", info.Name())
	}
}
