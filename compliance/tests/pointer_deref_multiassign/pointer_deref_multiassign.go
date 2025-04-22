package main

type MyStruct struct {
	MyInt    int
	MyString string
	myBool   bool
}

func main() {
	structPointer := &MyStruct{MyInt: 4, MyString: "hello world"}
	// === Pointer Dereference and Multi-Assignment ===
	// Dereference structPointer to get a copy of the struct.
	// Also demonstrates multi-variable assignment and the use of the blank identifier '_'.
	dereferencedStructCopy, _, _, unusedString := *structPointer, structPointer.myBool, structPointer.MyInt, "hello" // testing _ set
	_ = unusedString                                                                                                 // Explicitly ignore unusedString to satisfy linters
}
