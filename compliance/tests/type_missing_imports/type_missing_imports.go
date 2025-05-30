package main

// memory.go file content (simulated in same file for test)
type file struct {
	name string
	data []byte
}

// storage.go file content
type storage struct {
	files    map[string]*file
	children map[string]map[string]*file
}

func main() {
	s := storage{
		files:    make(map[string]*file),
		children: make(map[string]map[string]*file),
	}

	f := &file{
		name: "test.txt",
		data: []byte("hello world"),
	}

	s.files["test"] = f

	println("Created storage with file:", s.files["test"].name)
}
