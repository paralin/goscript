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

// NewMyStruct creates a new MyStruct instance.
func NewMyStruct(s string) MyStruct {
	return MyStruct{MyString: s}
}

func main() {
	println("Hello world")

	// === Pointer Initialization ===
	// Create a pointer to a MyStruct instance using a composite literal.
	structPointer := &MyStruct{MyInt: 4, MyString: "hello world"}
	// Expected: "hello world"
	println("Initial MyString (via pointer): Expected: hello world, Actual: " + structPointer.MyString)

	// === Pointer Dereference and Multi-Assignment ===
	// Dereference structPointer to get a copy of the struct.
	// Also demonstrates multi-variable assignment and the use of the blank identifier '_'.
	dereferencedStructCopy, _, _, unusedString := *structPointer, structPointer.myBool, structPointer.MyInt, "hello" // testing _ set
	_ = unusedString                                                                                                 // Explicitly ignore unusedString to satisfy linters

	// === Simple Dereference Assignment (Value Copy) ===
	// Dereferencing structPointer creates a *copy* of the struct.
	simpleDereferencedCopy := *structPointer
	// Modifying the copy does not affect the original struct pointed to by structPointer.
	simpleDereferencedCopy.MyString = "modified dereferenced copy"
	// Expected: "hello world"
	println("Original structPointer after modifying simpleDereferencedCopy: Expected: hello world, Actual: " + structPointer.MyString)
	// Expected: "modified dereferenced copy"
	println("Simple Dereferenced Copy: Expected: modified dereferenced copy, Actual: " + simpleDereferencedCopy.MyString)

	// === Value-Type Copy Behavior ===
	// Assigning a struct (value type) creates independent copies.
	valueCopy1, valueCopy2, pointerCopy := dereferencedStructCopy, dereferencedStructCopy, structPointer
	// Modifications to one copy do not affect others or the original.
	valueCopy1.MyString = "value copy 1"
	dereferencedStructCopy.MyString = "original dereferenced copy modified" // Modify the source of the copies
	valueCopy2.MyString = "value copy 2"

	// === Composite Literal Assignment (Value Copy) ===
	// Creating a struct directly using a composite literal.
	structLiteral := MyStruct{MyString: "composite literal"}
	// Assigning it creates another independent copy.
	structLiteralCopy := structLiteral
	structLiteralCopy.MyString = "modified composite literal copy"
	// Expected: "composite literal"
	println("Original struct literal: Expected: composite literal, Actual: " + structLiteral.MyString)
	// Expected: "modified composite literal copy"
	println("Modified struct literal copy: Expected: modified composite literal copy, Actual: " + structLiteralCopy.MyString)

	// === Function Call Result Assignment (Value Copy) ===
	// Assigning the result of a function that returns a struct creates a copy.
	structFromFunc := NewMyStruct("function result")
	structFromFuncCopy := structFromFunc
	structFromFuncCopy.MyString = "modified function result copy"
	// Expected: "function result"
	println("Original struct from function: Expected: function result, Actual: " + structFromFunc.MyString)
	// Expected: "modified function result copy"
	println("Modified struct from function copy: Expected: modified function result copy, Actual: " + structFromFuncCopy.MyString)

	// === Method Call on Pointer Receiver ===
	// Calling a method with a pointer receiver (*MyStruct) using a pointer variable.
	println("Method call on pointer (structPointer): Expected: hello world, Actual: " + structPointer.GetMyString())

	// Go implicitly converts value types to pointers when calling pointer receiver methods.
	// println("Method call on value (dereferencedStructCopy): " + dereferencedStructCopy.GetMyString()) // This works due to implicit address taking

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
