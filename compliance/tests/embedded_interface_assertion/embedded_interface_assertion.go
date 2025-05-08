package main

type Reader interface {
	// Read reads data from the reader.
	Read([]byte) (int, error)
}

type Closer interface {
	Close() error
}

type ReadCloser interface {
	Reader
	Closer
}

type MyStruct struct {
	// Implements Reader and Closer
}

func (m MyStruct) Read(p []byte) (int, error) {
	// Dummy implementation
	return 0, nil
}

func (m MyStruct) Close() error {
	// Dummy implementation
	return nil
}

func main() {
	var rwc ReadCloser
	s := MyStruct{}
	rwc = s

	_, ok := rwc.(ReadCloser)
	if ok {
		println("Embedded interface assertion successful")
	} else {
		println("Embedded interface assertion failed")
	}
}
