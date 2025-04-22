package main

type MyStruct struct {
	MyInt    int
	MyString string
	myBool   bool
}

func main() {
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
}
