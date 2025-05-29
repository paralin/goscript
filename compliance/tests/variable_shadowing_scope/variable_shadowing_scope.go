package main

import (
	"os"
	"path/filepath"
)

type FileInfo interface {
	Name() string
}

type mockFileInfo struct {
	name string
}

func (m mockFileInfo) Name() string {
	return m.name
}

type mockFS struct{}

func (fs mockFS) Lstat(filename string) (FileInfo, error) {
	if filename == "error.txt" {
		return nil, os.ErrNotExist
	}
	return mockFileInfo{name: filename}, nil
}

func walkFn(filename string, info FileInfo, err error) error {
	if err != nil {
		println("Error walking:", filename, "error:", err.Error())
		return nil
	}
	println("File:", filename)
	return nil
}

func main() {
	fs := mockFS{}
	filename := "error.txt"

	fileInfo, err := fs.Lstat(filename)
	if err := walkFn(filename, fileInfo, err); err != nil && err != filepath.SkipDir {
		println("Walk function returned error")
		return
	}

	println("Walk completed successfully")
}
