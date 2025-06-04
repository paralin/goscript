package main

import (
	"os"
	"path/filepath"
	"time"
)

// Simulate billy.Filesystem interface
type Filesystem interface {
	ReadDir(path string) ([]os.FileInfo, error)
}

// MockFileInfo implements os.FileInfo for testing
type MockFileInfo struct {
	name string
	size int64
	dir  bool
}

func (m MockFileInfo) Name() string       { return m.name }
func (m MockFileInfo) Size() int64        { return m.size }
func (m MockFileInfo) Mode() os.FileMode  { return 0o644 }
func (m MockFileInfo) ModTime() time.Time { return time.Time{} }
func (m MockFileInfo) IsDir() bool        { return m.dir }
func (m MockFileInfo) Sys() interface{}   { return nil }

// MockFilesystem for testing
type MockFilesystem struct{}

func (fs MockFilesystem) ReadDir(path string) ([]os.FileInfo, error) {
	return []os.FileInfo{
		MockFileInfo{name: "file1.txt", size: 100, dir: false},
		MockFileInfo{name: "subdir", size: 0, dir: true},
	}, nil
}

// This is the exact function signature from the user's example
// walkFn is filepath.WalkFunc which should be nullable and need ! operator
func walk(fs Filesystem, path string, info os.FileInfo, walkFn filepath.WalkFunc) error {
	filename := path + "/" + info.Name()
	fileInfo := info

	// This is the exact call that should generate walkFn!(filename, fileInfo, err)
	// but currently generates walkFn(filename, fileInfo, err) - missing !
	if err := walkFn(filename, fileInfo, nil); err != nil && err != filepath.SkipDir {
		return err
	}

	// Additional test case with error variable
	var walkErr error = nil
	if err := walkFn(filename, fileInfo, walkErr); err != nil && err != filepath.SkipDir {
		return err
	}

	return nil
}

// Additional test with direct filepath.WalkFunc usage
func walkFiles(rootPath string, walkFn filepath.WalkFunc) error {
	// Test case: direct call to filepath.WalkFunc parameter
	// Should generate: walkFn!(rootPath, nil, nil)
	// Currently generates: walkFn(rootPath, nil, nil) - missing !
	return walkFn(rootPath, nil, nil)
}

// Test with filepath.WalkFunc in different contexts
func processPath(walkFn filepath.WalkFunc) {
	// Test case: function call in standalone statement
	// Should generate: walkFn!("test", nil, nil)
	walkFn("test", nil, nil)

	// Test case: function call in if condition
	// Should generate: if walkFn!("test", nil, nil) != nil
	if walkFn("test", nil, nil) != nil {
		println("Error occurred")
	}
}

func main() {
	fs := MockFilesystem{}
	fileInfo := MockFileInfo{name: "test.txt", size: 50, dir: false}

	// Test with actual filepath.WalkFunc
	walkFunc := func(path string, info os.FileInfo, err error) error {
		if info != nil {
			println("Walking:", path, "size:", info.Size())
		}
		if err != nil {
			println("Error:", err.Error())
		}
		return nil
	}

	// Test the walk function
	err := walk(fs, "/test", fileInfo, walkFunc)
	if err != nil {
		println("Walk error:", err.Error())
	}

	// Test walkFiles
	err2 := walkFiles("/root", walkFunc)
	if err2 != nil {
		println("WalkFiles error:", err2.Error())
	}

	// Test processPath
	processPath(walkFunc)
}
