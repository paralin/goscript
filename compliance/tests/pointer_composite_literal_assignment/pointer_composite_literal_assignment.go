package main

type MyStruct struct {
	MyInt    int
	MyString string
}

func main() {
	// === Pointer Composite Literal Assignment ===
	// Creating a pointer to a struct directly using a composite literal with &
	structPointer := &MyStruct{MyInt: 42, MyString: "composite literal pointer"}

	// Access fields through the pointer
	// Expected: 42
	println("MyInt via pointer: Expected: 42, Actual:", structPointer.MyInt)
	// Expected: "composite literal pointer"
	println("MyString via pointer: Expected: composite literal pointer, Actual: " + structPointer.MyString)

	// Modify through the pointer
	structPointer.MyInt = 99
	// Expected: 99
	println("MyInt after modification: Expected: 99, Actual:", structPointer.MyInt)
}
