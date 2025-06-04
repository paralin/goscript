package main

import (
	"errors"
	"sync"
)

type content struct {
	name  string
	bytes []byte
	m     sync.RWMutex
}

func (c *content) WriteAt(p []byte, off int64) (int, error) {
	if off < 0 {
		return 0, errors.New("negative offset")
	}

	c.m.Lock()
	prev := len(c.bytes)

	diff := int(off) - prev
	if diff > 0 {
		c.bytes = append(c.bytes, make([]byte, diff)...)
	}

	c.bytes = append(c.bytes[:off], p...)
	if len(c.bytes) < prev {
		c.bytes = c.bytes[:prev]
	}
	c.m.Unlock()

	return len(p), nil
}

func (c *content) ReadAt(b []byte, off int64) (n int, err error) {
	if off < 0 {
		return 0, errors.New("negative offset")
	}

	c.m.RLock()
	size := int64(len(c.bytes))
	if off >= size {
		c.m.RUnlock()
		return 0, errors.New("EOF")
	}

	l := int64(len(b))
	if off+l > size {
		l = size - off
	}

	btr := c.bytes[off : off+l]
	n = copy(b, btr)

	if len(btr) < len(b) {
		err = errors.New("EOF")
	}
	c.m.RUnlock()

	return
}

func (c *content) Size() int {
	c.m.RLock()
	defer func() {
		c.m.RUnlock()
	}()
	return len(c.bytes)
}

func (c *content) Clear() {
	c.m.Lock()
	defer c.m.Unlock()
	// Variable shadowing that might cause scoping issues
	if len := len(c.bytes); len > 0 {
		c.bytes = make([]byte, 0)
	}
}

// Method with complex variable scoping
func (c *content) ComplexMethod() error {
	c.m.Lock()
	defer c.m.Unlock()

	// Initial receiver usage
	if len(c.bytes) == 0 {
		c.bytes = make([]byte, 10)
	}

	// Variable shadowing in a loop
	for i := 0; i < 3; i++ {
		if data, err := c.getData(i); err == nil {
			// Nested scope with receiver usage
			if len(data) > 0 {
				c.bytes = append(c.bytes, data...)
			}
		}
	}

	// More complex scoping with if statements
	if x := len(c.bytes); x > 20 {
		// Use receiver in nested scope
		c.bytes = c.bytes[:20]

		// Nested function literal that might affect scoping
		fn := func() {
			if len(c.bytes) > 0 {
				c.bytes[0] = 42
			}
		}
		fn()
	}

	return nil
}

func (c *content) getData(index int) ([]byte, error) {
	if index < 0 {
		return nil, errors.New("invalid index")
	}
	return []byte{byte(index), byte(index + 1)}, nil
}

// Simple methods that should trigger receiver binding but might not
func (c *content) Truncate() {
	c.bytes = make([]byte, 0)
}

func (c *content) Len() int {
	return len(c.bytes)
}

func main() {
	c := &content{
		name:  "test",
		bytes: make([]byte, 0),
	}

	// Test basic functionality that should work
	if err := c.ComplexMethod(); err != nil {
		println("Error:", err.Error())
		return
	}

	println("Complex method completed, size:", c.Size())
}
