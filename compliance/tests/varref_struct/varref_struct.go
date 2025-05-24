package main

type MyStruct struct {
	MyInt int
}

func main() {
	// 'val' is a value type, but its address is taken, so it should be varrefed in TS.
	val := MyStruct{MyInt: 10}
	ptrToVal := &val

	// Accessing pointer value, should use .value
	println("ptrToVal.MyInt:", ptrToVal.MyInt)

	// Accessing pointer value, should use .value
	myIntVal := ptrToVal.MyInt
	println("myIntVal:", myIntVal)
}
