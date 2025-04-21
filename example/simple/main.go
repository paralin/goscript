package main

// MyStruct is converted into a class.
type MyStruct struct {
	// MyInt is a public integer field, initialized to zero.
	MyInt int
	// MyString is a public string field, initialized to empty string.
	MyString string
	// myBool is a private boolean field, intialized to false.
	myBool bool
}

func main() {
	println("Hello world")

	myVar := &MyStruct{MyInt: 4, MyString: "hello world"}
	println("MyString: " + myVar.MyString)

	// testing pointer dereference a struct
	// myOtherVar := *myVar
	myOtherVar, _, _, myString := *myVar, myVar.myBool, myVar.MyInt, "hello" // testing _ set
	_ = myString

	// testing value-type copy
	myThirdVar, myFourthVar, myFifthVar := myOtherVar, myOtherVar, myVar
	myThirdVar.MyString = "this is third var"
	myOtherVar.MyString = "this is second var"
	myFourthVar.MyString = "this is fourth var"

	println("This should say MyString: " + myFifthVar.MyString)
	println("This should say second: " + myOtherVar.MyString)
	println("This should say third: " + myThirdVar.MyString)
	println("This should say fourth: " + myFourthVar.MyString)
}
