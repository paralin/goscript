package main

type MyStruct struct {
	MyInt    int
	MyString string
	myBool   bool
}

// NewMyStruct creates a new MyStruct instance.
func NewMyStruct(s string) MyStruct {
	return MyStruct{MyString: s}
}

func main() {
	// === Function Call Result Assignment (Value Copy) ===
	// Assigning the result of a function that returns a struct creates a copy.
	structFromFunc := NewMyStruct("function result")
	structFromFuncCopy := structFromFunc
	structFromFuncCopy.MyString = "modified function result copy"
	// Expected: "function result"
	println("Original struct from function: Expected: function result, Actual: " + structFromFunc.MyString)
	// Expected: "modified function result copy"
	println("Modified struct from function copy: Expected: modified function result copy, Actual: " + structFromFuncCopy.MyString)
}
