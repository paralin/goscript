package main

// MyStruct is converted into a class.
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

// NewMyStruct creates a new MyStruct instance.
func NewMyStruct(s string) MyStruct {
	return MyStruct{MyString: s}
}

func main() {
	println("Hello world")

	myVar := &MyStruct{MyInt: 4, MyString: "hello world"}
	println("MyString: " + myVar.MyString)

	// testing pointer dereference a struct
	// myOtherVar := *myVar
	myOtherVar, _, _, myString := *myVar, myVar.myBool, myVar.MyInt, "hello" // testing _ set
	_ = myString

	// Simple dereference assignment
	derefVar := *myVar
	derefVar.MyString = "modified derefVar"
	println("Original myVar after derefVar mod: " + myVar.MyString) // Should still be "hello world"
	println("DerefVar: " + derefVar.MyString)

	// testing value-type copy
	myThirdVar, myFourthVar, myFifthVar := myOtherVar, myOtherVar, myVar
	myThirdVar.MyString = "this is third var"
	myOtherVar.MyString = "this is second var"
	myFourthVar.MyString = "this is fourth var"

	// Testing composite literal assignments
	compositeLitVar := MyStruct{MyString: "composite literal"}
	compositeCopy := compositeLitVar
	compositeCopy.MyString = "modified composite"
	println("Original composite: " + compositeLitVar.MyString)
	println("Modified composite: " + compositeCopy.MyString)

	// Testing function call result assignments
	funcResultVar := NewMyStruct("function result")
	funcCopy := funcResultVar
	funcCopy.MyString = "modified function result"
	println("Original function result: " + funcResultVar.MyString)
	println("Modified function result: " + funcCopy.MyString)

	// Testing method call
	println("Method call on myVar: " + myVar.GetMyString())

	// Note: Calling GetMyString on myOtherVar (a value) would require a pointer.
	// Go allows this implicitly (&myOtherVar).GetMyString(), but direct translation might differ.
	// Let's test the pointer receiver method directly:
	println("Method call on pointer var: " + myVar.GetMyString())

	println("This should say MyString: " + myFifthVar.MyString)
	println("This should say second: " + myOtherVar.MyString)
	println("This should say third: " + myThirdVar.MyString)
	println("This should say fourth: " + myFourthVar.MyString)
}
