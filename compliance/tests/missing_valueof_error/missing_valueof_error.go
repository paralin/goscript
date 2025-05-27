package main

// Test case that replicates the missing valueOf error
// The issue: if ($.cap(p!.buf) > 64 * 1024) should be if ($.cap(p!.buf.valueOf()) > 64 * 1024)

type buffer struct {
	data []byte
}

type printer struct {
	buf *buffer
}

func (p *printer) free() {
	// This should generate: if ($.cap(p!.buf.valueOf()) > 64 * 1024)
	// But incorrectly generates: if ($.cap(p!.buf) > 64 * 1024)
	if cap(p.buf.data) > 64*1024 {
		p.buf = nil
	} else {
		// Reset buffer
		p.buf.data = p.buf.data[:0]
	}
}

func (p *printer) checkCapacity() int {
	// Another case where valueOf should be used
	return cap(p.buf.data)
}

func (p *printer) getLength() int {
	// Another case where valueOf should be used
	return len(p.buf.data)
}

func main() {
	buf := &buffer{data: make([]byte, 0, 100000)}
	p := &printer{buf: buf}

	println("Initial capacity:", p.checkCapacity())
	println("Initial length:", p.getLength())

	// Add some data
	p.buf.data = append(p.buf.data, "hello world"...)
	println("After append length:", p.getLength())

	// Test free
	p.free()
	if p.buf != nil {
		println("Buffer not freed, capacity:", p.checkCapacity())
	} else {
		println("Buffer was freed")
	}
}
