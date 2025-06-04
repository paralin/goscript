package main

import (
	"os"
)

// FileInfo represents file information (simplified version of os.FileInfo)
type FileInfo interface {
	Name() string
	Size() int64
	IsDir() bool
}

// WalkFunc is the type of function called for each file or directory
// visited by Walk. Returns an error to stop walking (can be SkipDir).
type WalkFunc func(path string, info FileInfo, err error) error

// SkipDir is used as a return value from WalkFunc to indicate that
// the directory named in the call is to be skipped.
var SkipDir = os.ErrNotExist

// Filesystem interface (simplified version of billy.Filesystem)
type Filesystem interface {
	ReadDir(path string) ([]FileInfo, error)
}

// MockFileInfo implements FileInfo for testing
type MockFileInfo struct {
	name  string
	size  int64
	isDir bool
}

func (m *MockFileInfo) Name() string { return m.name }
func (m *MockFileInfo) Size() int64  { return m.size }
func (m *MockFileInfo) IsDir() bool  { return m.isDir }

// MockFilesystem implements Filesystem for testing
type MockFilesystem struct{}

func (m *MockFilesystem) ReadDir(path string) ([]FileInfo, error) {
	return []FileInfo{
		&MockFileInfo{name: "file1.txt", size: 100, isDir: false},
		&MockFileInfo{name: "subdir", size: 0, isDir: true},
	}, nil
}

// walk is a simplified version of filepath.Walk that demonstrates the issue
// walkFn is a nullable function parameter that needs non-null assertion when called
func walk(fs Filesystem, path string, info FileInfo, walkFn WalkFunc) error {
	// Test case 1: Direct call to nullable function parameter
	// This should generate: walkFn!(path, info, nil)
	// But currently generates: walkFn(path, info, nil) - missing !
	err := walkFn(path, info, nil)
	if err != nil && err != SkipDir {
		return err
	}

	// Test case 2: Call with error parameter
	var walkErr error = nil
	// This should also generate: walkFn!(path, info, walkErr)
	result := walkFn(path, info, walkErr)
	if result != nil {
		return result
	}

	return nil
}

// Additional test with different function signature
type ProcessFunc func(data string) (string, error)

func processWithCallback(input string, processor ProcessFunc) (string, error) {
	// Test case 3: Function parameter with return values
	// This should generate: processor!(input)
	// But currently generates: processor(input) - missing !
	return processor(input)
}

func main() {
	fs := &MockFilesystem{}
	fileInfo := &MockFileInfo{name: "test.txt", size: 50, isDir: false}

	// Test the walk function with a callback
	walkFunc := func(path string, info FileInfo, err error) error {
		println("Walking:", path, "size:", info.Size())
		if err != nil {
			println("Error:", err.Error())
		}
		return nil
	}

	err := walk(fs, "/test", fileInfo, walkFunc)
	if err != nil {
		println("Walk error:", err.Error())
	}

	// Test the process function with a callback
	processFunc := func(data string) (string, error) {
		return "processed: " + data, nil
	}

	result, err2 := processWithCallback("hello", processFunc)
	if err2 != nil {
		println("Process error:", err2.Error())
	} else {
		println("Process result:", result)
	}
}
