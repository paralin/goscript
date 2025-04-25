package main

type MyStruct struct {
	MyInt    int
	MyString string
}

func main() {
	original := &MyStruct{MyInt: 10, MyString: "original"}

	// === Pointer Assignment (No Copy) ===
	// Assigning a pointer variable to another pointer variable.
	pointerCopy := original

	// Modify the struct through the original pointer.
	original.MyString = "modified original"

	// The change should be reflected when accessing through the copied pointer.
	// Expected: "modified original"
	println("Pointer copy value: Expected: modified original, Actual: " + pointerCopy.MyString)

	// Modify the struct through the copied pointer.
	pointerCopy.MyInt = 20

	// The change should be reflected when accessing through the original pointer.
	// Expected: 20
	println("Original value after pointer copy modification: Expected: 20, Actual:", original.MyInt)
}
