package main

type MyStruct struct {
	myPrivate *int
}

func main() {
	myStruct := &MyStruct{myPrivate: nil}
	var intVar int = 10
	myStruct.myPrivate = &intVar
	intVar = 15
	println(*myStruct.myPrivate)
}
