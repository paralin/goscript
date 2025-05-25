package main

// MyStruct is a simple struct.
type MyStruct struct {
	MyInt    int
	MyString string
	myBool   bool
}

func main() {
	// Test new(MyStruct)
	ptr := new(MyStruct)
	println("ptr.MyInt (default):", ptr.MyInt)       // Expected: 0
	println("ptr.MyString (default):", ptr.MyString) // Expected: ""
	println("ptr.myBool (default):", ptr.myBool)     // Expected: false

	ptr.MyInt = 42
	ptr.MyString = "hello"
	ptr.myBool = true

	println("ptr.MyInt (assigned):", ptr.MyInt)       // Expected: 42
	println("ptr.MyString (assigned):", ptr.MyString) // Expected: "hello"
	println("ptr.myBool (assigned):", ptr.myBool)     // Expected: true

	// Test assignment to a dereferenced new struct
	var s MyStruct = *new(MyStruct)
	println("s.MyInt (default):", s.MyInt)       // Expected: 0
	println("s.MyString (default):", s.MyString) // Expected: ""
	println("s.myBool (default):", s.myBool)     // Expected: false

	s.MyInt = 100
	s.MyString = "world"
	s.myBool = false // though private, it's in the same package

	println("s.MyInt (assigned):", s.MyInt)       // Expected: 100
	println("s.MyString (assigned):", s.MyString) // Expected: "world"
	println("s.myBool (assigned):", s.myBool)     // Expected: false
}
