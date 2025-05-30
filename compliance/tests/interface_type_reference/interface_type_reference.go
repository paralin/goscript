package main

import "os"

// Basic abstract the basic operations in a storage-agnostic interface as
// an extension to the Basic interface.
type Basic interface {
	// Stat returns a FileInfo describing the named file.
	Stat(filename string) (os.FileInfo, error)
}

type MyStorage struct{}

func (s MyStorage) Stat(filename string) (os.FileInfo, error) {
	return nil, nil
}

func main() {
	var b Basic = MyStorage{}
	_, err := b.Stat("test.txt")
	if err == nil {
		println("Stat call successful")
	}
}
