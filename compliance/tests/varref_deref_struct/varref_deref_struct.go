package main

type MyStruct struct {
	MyInt int
}

func main() {
	// We need to make sure we don't add .value for this
	myStruct := &MyStruct{}
	(*myStruct).MyInt = 5
	println((*myStruct).MyInt)

	myOtherStruct := &MyStruct{MyInt: 1}
	if myOtherStruct != myStruct {
		println("expected not equal")
	}
}
