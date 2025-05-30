package main

import (
	"fmt"
	"os"
)

func main() {
	// Test creating a PathError using composite literal syntax
	err := &os.PathError{
		Op:   "readlink",
		Path: "/some/path",
		Err:  fmt.Errorf("not a symlink"),
	}

	println(err.Op)
	println(err.Path)
	println(err.Err.Error())
}
