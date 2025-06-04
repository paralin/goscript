package main

import (
	"os"
	"path/filepath"
)

// Mock billy.Filesystem for testing
type Filesystem interface {
	Lstat(filename string) (os.FileInfo, error)
}

type MockFilesystem struct{}

func (fs MockFilesystem) Lstat(filename string) (os.FileInfo, error) {
	return nil, nil
}

// Reproduce the exact variable shadowing scenario that causes the issue
func walkWithShadowing(fs Filesystem, path string, info os.FileInfo, walkFn filepath.WalkFunc) error {
	// This reproduces the exact pattern from the user's code
	// where variable shadowing occurs with := assignment
	fileInfo, err := fs.Lstat(path)
	if err != nil {
		// This is the problematic line that generates:
		// let err = walkFn(filename, fileInfo, _temp_err) - missing !
		// Instead of:
		// let err = walkFn!(filename, fileInfo, _temp_err) - with !
		if err := walkFn(path, fileInfo, err); err != nil && err != filepath.SkipDir {
			return err
		}
	}
	return nil
}

// Additional test cases with different variable shadowing scenarios
func testShadowing1(walkFn filepath.WalkFunc) error {
	var err error = nil
	// Case 1: Direct shadowing with if statement
	if err := walkFn("test1", nil, err); err != nil {
		return err
	}
	return nil
}

func testShadowing2(walkFn filepath.WalkFunc) error {
	// Case 2: Multiple levels of shadowing
	outerErr := os.ErrNotExist // Use a known error instead of errors.New
	{
		if err := walkFn("test2", nil, outerErr); err != nil {
			return err
		}
	}
	return nil
}

func testShadowing3(walkFn filepath.WalkFunc) error {
	// Case 3: Shadowing in for loop
	errorList := []error{nil, os.ErrNotExist} // Use os.ErrNotExist instead of errors.New
	for _, err := range errorList {
		if err := walkFn("test3", nil, err); err != nil {
			return err
		}
	}
	return nil
}

// Non-shadowing case for comparison
func testNoShadowing(walkFn filepath.WalkFunc) error {
	// This should work correctly (no shadowing)
	return walkFn("test", nil, nil)
}

func main() {
	fs := MockFilesystem{}

	walkFunc := func(path string, info os.FileInfo, err error) error {
		if err != nil {
			println("Error:", err.Error())
		}
		println("Walking:", path)
		return nil
	}

	// Test the shadowing scenario
	err := walkWithShadowing(fs, "/test", nil, walkFunc)
	if err != nil {
		println("Error:", err.Error())
	}

	// Test other shadowing cases
	testShadowing1(walkFunc)
	testShadowing2(walkFunc)
	testShadowing3(walkFunc)
	testNoShadowing(walkFunc)
}
