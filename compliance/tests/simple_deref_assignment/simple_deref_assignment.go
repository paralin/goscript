package main

type MyStruct struct {
	MyInt    int
	MyString string
}

func main() {
	structPointer := &MyStruct{MyInt: 4, MyString: "hello world"}
	// === Simple Dereference Assignment (Value Copy) ===
	simpleDereferencedCopy := *structPointer
	// Modifying the copy does not affect the original struct pointed to by structPointer.
	simpleDereferencedCopy.MyString = "modified dereferenced copy"
	// Expected: "hello world"
	println("Original structPointer after modifying simpleDereferencedCopy: Expected: hello world, Actual: " + structPointer.MyString)
	// Expected: "modified dereferenced copy"
	println("Simple Dereferenced Copy: Expected: modified dereferenced copy, Actual: " + simpleDereferencedCopy.MyString)
}
