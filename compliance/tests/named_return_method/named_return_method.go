package main

type content struct {
	bytes []byte
}

func (c *content) ReadAt(b []byte, off int64) (n int, err error) {
	if off < 0 || off >= int64(len(c.bytes)) {
		err = nil // Simulate an error scenario
		return
	}

	l := int64(len(b))
	if off+l > int64(len(c.bytes)) {
		l = int64(len(c.bytes)) - off
	}

	btr := c.bytes[off : off+l]
	n = copy(b, btr)
	return
}

func (c *content) ProcessData(input int) (result int, status string, valid bool) {
	result = input * 2
	if input > 10 {
		status = "high"
		valid = true
	} else if input > 0 {
		status = "low"
		valid = true
	} else {
		// status and valid will be zero values
		status = "invalid"
	}
	return
}

func main() {
	c := &content{
		bytes: []byte("Hello, World!"),
	}

	// Test ReadAt method
	buf := make([]byte, 5)
	n1, err1 := c.ReadAt(buf, 0)
	println(n1) // Expected: 5
	if err1 == nil {
		println("nil") // Expected: nil
	} else {
		println("error")
	}
	println(string(buf)) // Expected: Hello

	// Test ReadAt with different offset
	buf2 := make([]byte, 6)
	n2, err2 := c.ReadAt(buf2, 7)
	println(n2) // Expected: 6
	if err2 == nil {
		println("nil") // Expected: nil
	} else {
		println("error")
	}
	println(string(buf2)) // Expected: World!

	// Test ProcessData method
	r1, s1, v1 := c.ProcessData(15)
	println(r1) // Expected: 30
	println(s1) // Expected: high
	println(v1) // Expected: true

	r2, s2, v2 := c.ProcessData(5)
	println(r2) // Expected: 10
	println(s2) // Expected: low
	println(v2) // Expected: true

	r3, s3, v3 := c.ProcessData(-1)
	println(r3) // Expected: -2
	println(s3) // Expected: invalid
	println(v3) // Expected: false
}
