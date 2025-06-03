package main

import "os"

type TestStruct struct {
	Mode os.FileMode
	File *os.File
}

func main() {
	// Test initialized struct
	s := TestStruct{
		Mode: 420, // 420 in decimal
		File: nil,
	}

	println("Mode:", int(s.Mode))
	println("File is nil:", s.File == nil)

	// Test zero values
	var zero TestStruct
	println("Zero Mode:", int(zero.Mode))
	println("Zero File is nil:", zero.File == nil)
}
