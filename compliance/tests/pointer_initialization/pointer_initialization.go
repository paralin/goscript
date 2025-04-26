package main

// MyStruct demonstrates a simple struct with public and private fields.
type MyStruct struct {
	MyInt    int
	MyString string
}

func main() {
	// === Pointer Initialization ===
	// Create a pointer to a MyStruct instance using a composite literal.
	structPointer := &MyStruct{MyInt: 4, MyString: "hello world"}
	// Expected: "hello world"
	println("Initial MyString (via pointer): Expected: hello world, Actual: " + structPointer.MyString)
}
