package main

type Reader interface {
	Read(p []byte) (int, error)
}

type MyReader struct {
	Reader
	name string
}

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
	mr1 := &MyReader{name: "test1"}
	println(mr1.Reader == nil)

	sr := &StringReader{data: "hello", pos: 0}
	mr2 := &MyReader{Reader: sr, name: "test2"}
	println(mr2.Reader != nil)

	buf := make([]byte, 5)
	n, _ := mr2.Read(buf)
	println(n == 5)

	println(10)
	println(15)
	println(true)
}
