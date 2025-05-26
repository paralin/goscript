package main

type MockInode struct {
	Value int
}

func (m *MockInode) getValue() int {
	return m.Value
}

func main() {
	// This should generate: let childInode: MockInode | null = new MockInode({Value: 42})
	// Not: let childInode: MockInode | null = $.varRef(new MockInode({Value: 42}))
	// Because we're taking the address of a composite literal, not a variable
	var childInode *MockInode = &MockInode{Value: 42}

	// Use the pointer
	println("childInode.Value:", childInode.Value)
	println("childInode.getValue():", childInode.getValue())
}
