package main

import (
	"testing/fstest"
	"time"
)

func main() {
	// Create a MapFS with some test files
	fsys := fstest.MapFS{
		"hello.txt": &fstest.MapFile{
			Data: []byte("Hello, World!"),
		},
		"dir/subfile.txt": &fstest.MapFile{
			Data: []byte("This is a subfile"),
		},
		"dir": &fstest.MapFile{
			Mode: 0o755 | (1 << (32 - 1 - 20)), // fs.ModeDir
		},
		"binary.bin": &fstest.MapFile{
			Data:    []byte{0x48, 0x65, 0x6c, 0x6c, 0x6f},
			ModTime: time.Date(2023, 1, 1, 0, 0, 0, 0, time.UTC),
		},
	}

	// Test Open and read a file
	file, err := fsys.Open("hello.txt")
	if err != nil {
		println("Error opening hello.txt:", err.Error())
		return
	}

	data := make([]byte, 20)
	n, err := file.Read(data)
	if err != nil {
		println("Error reading hello.txt:", err.Error())
		return
	}
	println("Read from hello.txt:", string(data[:n]))
	file.Close()

	// Test ReadFile
	content, err := fsys.ReadFile("dir/subfile.txt")
	if err != nil {
		println("Error reading dir/subfile.txt:", err.Error())
		return
	}
	println("ReadFile dir/subfile.txt:", string(content))

	// Test Stat
	info, err := fsys.Stat("hello.txt")
	if err != nil {
		println("Error stating hello.txt:", err.Error())
		return
	}
	println("hello.txt size:", info.Size())
	println("hello.txt name:", info.Name())

	// Test ReadDir
	entries, err := fsys.ReadDir(".")
	if err != nil {
		println("Error reading directory:", err.Error())
		return
	}
	println("Directory entries:")
	for _, entry := range entries {
		println("  Entry:", entry.Name(), "IsDir:", entry.IsDir())
	}

	// Test ReadDir on subdirectory
	dirEntries, err := fsys.ReadDir("dir")
	if err != nil {
		println("Error reading dir:", err.Error())
		return
	}
	println("Dir entries:")
	for _, entry := range dirEntries {
		println("  Entry:", entry.Name(), "IsDir:", entry.IsDir())
	}

	// Test Glob
	matches, err := fsys.Glob("*.txt")
	if err != nil {
		println("Error globbing *.txt:", err.Error())
		return
	}
	println("Glob *.txt matches:")
	for _, match := range matches {
		println("  Match:", match)
	}

	// Test Sub
	subFS, err := fsys.Sub("dir")
	if err != nil {
		println("Error creating sub filesystem:", err.Error())
		return
	}

	subContent, err := subFS.(*fstest.MapFS).ReadFile("subfile.txt")
	if err != nil {
		println("Error reading from sub filesystem:", err.Error())
		return
	}
	println("Sub filesystem content:", string(subContent))

	println("testing/fstest MapFS test completed")
}
