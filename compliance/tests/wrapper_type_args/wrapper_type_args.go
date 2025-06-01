package main

import (
	"fmt"
	"os"
)

// Custom type with methods (wrapper type)
type MyMode os.FileMode

func (m MyMode) IsExecutable() bool {
	return (m & 0o111) != 0
}

func (m MyMode) String() string {
	return fmt.Sprintf("%o", uint32(m))
}

// Interface that expects the wrapper type
type DirInterface interface {
	MkdirAll(path string, perm os.FileMode) error
}

// Implementation of the interface
type MyDir struct{}

func (d *MyDir) MkdirAll(path string, perm os.FileMode) error {
	fmt.Printf("MkdirAll called with path=%s, perm=%s\n", path, perm.String())
	return nil
}

// Function that takes wrapper type directly
func TestFileMode(mode os.FileMode) {
	fmt.Printf("TestFileMode called with mode=%s\n", mode.String())
}

// Function that takes custom wrapper type
func TestMyMode(mode MyMode) {
	fmt.Printf("TestMyMode called with mode=%s, executable=%t\n", mode.String(), mode.IsExecutable())
}

func main() {
	// Test passing literals to functions expecting wrapper types
	TestFileMode(0o644) // Should become: TestFileMode(new os.FileMode(0o644))
	TestFileMode(0o755) // Should become: TestFileMode(new os.FileMode(0o755))

	TestMyMode(0o755) // Should become: TestMyMode(new MyMode(0o755))
	TestMyMode(0o600) // Should become: TestMyMode(new MyMode(0o600))

	// Test interface method calls
	var dir DirInterface = &MyDir{}
	dir.MkdirAll("/tmp/test", 0o700) // Should become: dir.MkdirAll("/tmp/test", new os.FileMode(0o700))

	// Test with existing FileMode values (should not be wrapped again)
	existingMode := os.FileMode(0o644)
	TestFileMode(existingMode) // Should stay as-is

	// Test arithmetic operations (should use valueOf)
	combined := os.FileMode(0o755) | 0o022 // Should become: os.FileMode(0o755).valueOf() | 0o022
	TestFileMode(combined)

	fmt.Println("Test completed")
}
