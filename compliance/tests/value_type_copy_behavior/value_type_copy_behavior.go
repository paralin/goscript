package main

type MyStruct struct {
	MyInt    int
	MyString string
	myBool   bool
}

func main() {
	dereferencedStructCopy := MyStruct{MyString: "original"}
	// === Value-Type Copy Behavior ===
	// Assigning a struct (value type) creates independent copies.
	valueCopy1, valueCopy2, pointerCopy := dereferencedStructCopy, dereferencedStructCopy, &dereferencedStructCopy
	// Modifications to one copy do not affect others or the original.
	valueCopy1.MyString = "value copy 1"
	dereferencedStructCopy.MyString = "original dereferenced copy modified" // Modify the source of the copies
	valueCopy2.MyString = "value copy 2"
	// Expected: "value copy 1"
	println("valueCopy1: Expected: value copy 1, Actual: " + valueCopy1.MyString)
	// Expected: "original dereferenced copy modified"
	println("dereferencedStructCopy (modified after copies were made): Expected: original dereferenced copy modified, Actual: " + dereferencedStructCopy.MyString)
	// Expected: "value copy 2"
	println("valueCopy2: Expected: value copy 2, Actual: " + valueCopy2.MyString)
	_ = pointerCopy
}
