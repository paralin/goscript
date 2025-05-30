package main

import "os"

type ByName []os.FileInfo

func (a ByName) Len() int           { return len(a) }
func (a ByName) Less(i, j int) bool { return a[i].Name() < a[j].Name() }
func (a ByName) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }

func main() {
	// Create a ByName instance to test the wrapper
	var files ByName = make([]os.FileInfo, 2)
	println("Length:", files.Len())

	// Test type conversion
	var slice []os.FileInfo = []os.FileInfo(files)
	println("Slice length:", len(slice))
}
