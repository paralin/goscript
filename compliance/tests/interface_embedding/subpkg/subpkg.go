package subpkg

// File represents a file interface from another package (like billy.File)
type File interface {
	// Name returns the name of the file
	Name() string
	// Close closes the file
	Close() error
	// Write writes data to the file
	Write(data []byte) (int, error)
}

// MockFile is a simple implementation of the File interface
type MockFile struct {
	filename string
	data     []byte
}

func NewMockFile(name string) *MockFile {
	return &MockFile{
		filename: name,
		data:     make([]byte, 0),
	}
}

func (m *MockFile) Name() string {
	return m.filename
}

func (m *MockFile) Close() error {
	return nil
}

func (m *MockFile) Write(data []byte) (int, error) {
	m.data = append(m.data, data...)
	return len(data), nil
}
