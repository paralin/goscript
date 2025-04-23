package main

type MyStruct struct {
	MyInt    int
	MyString string
}

func main() {
	// === Struct Field Access ===
	ms := MyStruct{MyInt: 42, MyString: "foo"}
	println("MyInt: Expected: 42, Actual:", ms.MyInt)
	println("MyString: Expected: foo, Actual:", ms.MyString)
}
