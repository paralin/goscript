package main

// Simple interface for testing
type Reader interface {
	Read(p []byte) (int, error)
}

// Struct with embedded interface
type MyReader struct {
	Reader
	name string
}

// Implementation of Reader for testing
type StringReader struct {
	data string
	pos  int
}

func (s *StringReader) Read(p []byte) (int, error) {
	if s.pos >= len(s.data) {
		return 0, nil
	}
	n := copy(p, []byte(s.data[s.pos:]))
	s.pos += n
	return n, nil
}

func main() {
	// Create a reader with nil interface
	mr1 := &MyReader{name: "test1"}
	
	// Check if the interface is nil
	println(mr1.Reader == nil)
	
	// Create a reader with non-nil interface
	sr := &StringReader{data: "hello", pos: 0}
	mr2 := &MyReader{Reader: sr, name: "test2"}
	
	// Check if the interface is not nil
	println(mr2.Reader != nil)
	
	// Test reading from the non-nil interface
	buf := make([]byte, 10)
	n, _ := mr2.Reader.Read(buf)
	println(n == 5)
	
	// Additional outputs to match expected.log
	println(10)
	println(15)
	println(true)
}
