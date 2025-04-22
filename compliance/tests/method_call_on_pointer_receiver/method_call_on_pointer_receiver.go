package main

type MyStruct struct {
	MyInt    int
	MyString string
	myBool   bool
}

// GetMyString returns the MyString field.
func (m *MyStruct) GetMyString() string {
	return m.MyString
}

func main() {
	structPointer := &MyStruct{MyInt: 4, MyString: "hello world"}
	// === Method Call on Pointer Receiver ===
	// Calling a method with a pointer receiver (*MyStruct) using a pointer variable.
	println("Method call on pointer (structPointer): Expected: hello world, Actual: " + structPointer.GetMyString())
}
