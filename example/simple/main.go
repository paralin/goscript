package main

// MyStruct demonstrates a simple struct with public and private fields.
// It will be converted into a TypeScript class by goscript.
type MyStruct struct {
	// MyInt is a public integer field, initialized to zero.
	MyInt int
	// MyString is a public string field, initialized to empty string.
	MyString string
	// myBool is a private boolean field, initialized to false.
	myBool bool
}

// GetMyString returns the MyString field.
func (m *MyStruct) GetMyString() string {
	return m.MyString
}

// GetMyBool returns the myBool field.
func (m *MyStruct) GetMyBool() bool {
	return m.myBool
}

// NewMyStruct creates a new MyStruct instance.
func NewMyStruct(s string) MyStruct {
	return MyStruct{MyString: s}
}

func main() {
	println("Hello from GoScript example!")

	// Create and use a struct instance
	myInstance := NewMyStruct("example data")
	println("MyInstance string:", myInstance.GetMyString())
	myInstance.MyInt = 123
	println("MyInstance int:", myInstance.MyInt)
	println("MyInstance bool:", myInstance.GetMyBool()) // Call the new method
}
