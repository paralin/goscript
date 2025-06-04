package main

// Very simple method - just field access
func (s *storage) Len() int {
	return len(s.bytes)
}

// Very simple method - just field assignment
func (s *storage) Truncate() {
	s.bytes = make([]byte, 0)
}

// Simple method - field access in return
func (s *storage) Name() string {
	return s.name
}

// Simple method - field assignment with parameter
func (s *storage) SetName(name string) {
	s.name = name
}

// Simple method - field access with built-in function call
func (s *storage) IsEmpty() bool {
	return len(s.bytes) == 0
}
