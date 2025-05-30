package main

import "os"

type file struct {
	mode os.FileMode
	name string
}

func main() {
	f := file{
		mode: os.FileMode(0644),
		name: "test.txt",
	}

	println("File mode:", int(f.mode))
	println("File name:", f.name)

	// Test type assertion
	var mode os.FileMode = os.FileMode(0755)
	println("Mode type:", int(mode))
}
