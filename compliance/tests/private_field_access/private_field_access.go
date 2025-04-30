package main

type MyStruct struct {
	publicField  string
	privateField int
}

func NewMyStruct(pub string, priv int) MyStruct {
	return MyStruct{
		publicField:  pub,
		privateField: priv,
	}
}

func accessPrivateField(s MyStruct) {
	// Accessing privateField directly from a function in the same package
	// This should trigger the generation of the _private field
	println("Accessing privateField:", s.privateField)
}

func main() {
	s := NewMyStruct("hello", 123)
	accessPrivateField(s)
}
