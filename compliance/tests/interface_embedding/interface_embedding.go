package main

import (
	"io"

	"github.com/aperturerobotics/goscript/compliance/tests/interface_embedding/subpkg"
)

// File represents a file interface similar to billy.File
type File interface {
	// Name returns the name of the file as presented to Open.
	Name() string
	io.Writer
	io.Reader
	io.ReaderAt
	io.Seeker
	io.Closer
	// Lock locks the file like e.g. flock. It protects against access from
	// other processes.
	Lock() error
	// Unlock unlocks the file.
	Unlock() error
	// Truncate the file.
	Truncate(size int64) error
}

// MockFile is a simple implementation of the File interface for testing
type MockFile struct {
	filename string
	content  []byte
	position int64
}

func (m *MockFile) Name() string {
	return m.filename
}

func (m *MockFile) Write(p []byte) (int, error) {
	m.content = append(m.content, p...)
	return len(p), nil
}

func (m *MockFile) Read(p []byte) (int, error) {
	remaining := len(m.content) - int(m.position)
	if remaining <= 0 {
		return 0, io.EOF
	}

	n := copy(p, m.content[m.position:])
	m.position += int64(n)
	return n, nil
}

func (m *MockFile) ReadAt(p []byte, off int64) (int, error) {
	if off >= int64(len(m.content)) {
		return 0, io.EOF
	}

	n := copy(p, m.content[off:])
	return n, nil
}

func (m *MockFile) Seek(offset int64, whence int) (int64, error) {
	switch whence {
	case 0: // io.SeekStart
		m.position = offset
	case 1: // io.SeekCurrent
		m.position += offset
	case 2: // io.SeekEnd
		m.position = int64(len(m.content)) + offset
	}
	return m.position, nil
}

func (m *MockFile) Close() error {
	return nil
}

func (m *MockFile) Lock() error {
	return nil
}

func (m *MockFile) Unlock() error {
	return nil
}

func (m *MockFile) Truncate(size int64) error {
	if size < int64(len(m.content)) {
		m.content = m.content[:size]
	}
	return nil
}

// This is the struct that embeds the File interface
type file struct {
	File
	name string
}

func (f *file) Name() string {
	return f.name
}

// This struct embeds the qualified interface from subpkg to test qualified names
type qualifiedFile struct {
	subpkg.File // This should generate: constructor(init?: Partial<{File?: subpkg.File, metadata?: string}>)
	metadata    string
}

func main() {
	// Create a mock file implementation
	mockFile := &MockFile{
		filename: "test.txt",
		content:  []byte("Hello, World!"),
		position: 0,
	}

	// Create our embedded file struct
	f := &file{
		File: mockFile,
		name: "custom_name.txt",
	}

	// Test accessing the custom Name() method
	println("Custom name:", f.Name())

	// Test accessing embedded interface methods - these should have null assertions
	println("File name:", f.File.Name())

	// Test other embedded methods
	err := f.Lock()
	if err != nil {
		println("Lock error:", err.Error())
	} else {
		println("Lock successful")
	}

	err = f.Unlock()
	if err != nil {
		println("Unlock error:", err.Error())
	} else {
		println("Unlock successful")
	}

	// Test Write
	data := []byte("test data")
	n, err := f.Write(data)
	if err != nil {
		println("Write error:", err.Error())
	} else {
		println("Wrote bytes:", n)
	}

	// Test Read
	buf := make([]byte, 5)
	n, err = f.Read(buf)
	if err != nil {
		println("Read error:", err.Error())
	} else {
		println("Read bytes:", n)
	}

	// Test ReadAt
	buf2 := make([]byte, 5)
	n, err = f.ReadAt(buf2, 0)
	if err != nil {
		println("ReadAt error:", err.Error())
	} else {
		println("ReadAt bytes:", n)
	}

	// Test Seek
	pos, err := f.Seek(0, 0)
	if err != nil {
		println("Seek error:", err.Error())
	} else {
		println("Seek position:", pos)
	}

	// Test Truncate
	err = f.Truncate(5)
	if err != nil {
		println("Truncate error:", err.Error())
	} else {
		println("Truncate successful")
	}

	// Test Close
	err = f.Close()
	if err != nil {
		println("Close error:", err.Error())
	} else {
		println("Close successful")
	}

	// Test the qualified interface embedding
	qualifiedMock := subpkg.NewMockFile("qualified.txt")
	qf := &qualifiedFile{
		File:     qualifiedMock,
		metadata: "test metadata",
	}

	println("Qualified file name:", qf.Name())

	err = qf.Close()
	if err != nil {
		println("Qualified close error:", err.Error())
	} else {
		println("Qualified close successful")
	}

	// Test qualified write
	qn, err := qf.Write([]byte("qualified data"))
	if err != nil {
		println("Qualified write error:", err.Error())
	} else {
		println("Qualified wrote bytes:", qn)
	}
}
