package main

type MyStruct struct {
	myPrivate int
}

func main() {
	myStruct := &MyStruct{myPrivate: 4}
	myStruct.myPrivate = 10
	println(myStruct.myPrivate)
}
