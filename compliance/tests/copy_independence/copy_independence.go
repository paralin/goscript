package main

type MyStruct struct {
	MyInt    int
	MyString string
}

func main() {
	// Setup from previous steps (simplified for this test)
	structPointer := &MyStruct{MyInt: 4, MyString: "hello world"}
	dereferencedStructCopy := *structPointer
	dereferencedStructCopy.MyString = "original dereferenced copy modified"
	valueCopy1 := dereferencedStructCopy
	valueCopy1.MyString = "value copy 1"
	valueCopy2 := dereferencedStructCopy
	valueCopy2.MyString = "value copy 2"
	pointerCopy := structPointer

	// === Verifying Copy Independence ===
	// Expected: "hello world"
	println("pointerCopy (points to original structPointer): Expected: hello world, Actual: " + pointerCopy.MyString)
	// Expected: "original dereferenced copy modified"
	println("dereferencedStructCopy (modified after copies were made): Expected: original dereferenced copy modified, Actual: " + dereferencedStructCopy.MyString)
	// Expected: "value copy 1"
	println("valueCopy1: Expected: value copy 1, Actual: " + valueCopy1.MyString)
	// Expected: "value copy 2"
	println("valueCopy2: Expected: value copy 2, Actual: " + valueCopy2.MyString)
}
