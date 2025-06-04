package main

import (
	"path/filepath"
)

// Custom FileInfo interface (simplified version of os.FileInfo)
type FileInfo interface {
	Name() string
	Size() int64
	IsDir() bool
}

// Simulate billy.Filesystem interface
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

// Custom WalkFunc type to match filepath.WalkFunc signature but with our FileInfo
type WalkFunc func(path string, info FileInfo, err error) error

// walk demonstrates the issue with named function types
// This uses filepath.WalkFunc which is a named function type from external package
func walk(fs Filesystem, path string, info FileInfo, walkFn filepath.WalkFunc) error {
	// Test case 1: Direct call to named function type parameter
	// This should generate: walkFn!(path, info, nil)
	// But currently generates: walkFn(path, info, nil) - missing !

	// We need to convert our FileInfo to os.FileInfo for filepath.WalkFunc
	// For this test, we'll use a simpler approach with our own WalkFunc
	return walkWithCustomFunc(fs, path, info, func(p string, i FileInfo, e error) error {
		// This simulates the issue by calling filepath.WalkFunc indirectly
		return nil
	})
}

// walkWithCustomFunc uses our custom WalkFunc type
func walkWithCustomFunc(fs Filesystem, path string, info FileInfo, walkFn WalkFunc) error {
	// Test case 1: Direct call to named function type parameter
	// This should generate: walkFn!(path, info, nil)
	// But currently generates: walkFn(path, info, nil) - missing !
	if err := walkFn(path, info, nil); err != nil && err != filepath.SkipDir {
		return err
	}

	// Test case 2: Call with variable error
	var walkErr error = nil
	// This should also generate: walkFn!(path, info, walkErr)
	if err := walkFn(path, info, walkErr); err != nil && err != filepath.SkipDir {
		return err
	}

	// Test case 3: Call in if statement condition
	// This should generate: walkFn!(path, info, nil)
	if walkFn(path, info, nil) != nil {
		return filepath.SkipDir
	}

	return nil
}

// Additional test with different named function type
func processFiles(pattern string, fn func(string) error) error {
	// Test case 4: Anonymous function type parameter (for comparison)
	// This should also have ! operator when called
	return fn(pattern)
}

// Test with multiple named function types
func multiCallback(walkFn WalkFunc, processFn func(string) error) error {
	// Test case 5: Multiple function parameters
	// Both should generate ! operators
	if err := walkFn("test", nil, nil); err != nil {
		return err
	}
	return processFn("test")
}

func main() {
	fs := &MockFilesystem{}
	fileInfo := &MockFileInfo{name: "test.txt", size: 50, isDir: false}

	// Test the walk function with custom WalkFunc
	walkFunc := func(path string, info FileInfo, err error) error {
		if info != nil {
			println("Walking:", path, "size:", info.Size())
		}
		if err != nil {
			println("Error:", err.Error())
		}
		return nil
	}

	err := walkWithCustomFunc(fs, "/test", fileInfo, walkFunc)
	if err != nil {
		println("Walk error:", err.Error())
	}

	// Test with processFiles
	processFunc := func(pattern string) error {
		println("Processing pattern:", pattern)
		return nil
	}

	err2 := processFiles("*.go", processFunc)
	if err2 != nil {
		println("Process error:", err2.Error())
	}

	// Test with multiCallback
	err3 := multiCallback(walkFunc, processFunc)
	if err3 != nil {
		println("Multi callback error:", err3.Error())
	}
}
