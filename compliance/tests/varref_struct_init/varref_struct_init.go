package main

type MyStruct struct {
	MyInt int
}

func main() {
	// Scenario 1: Value type that NeedsVarRef
	// 'val' is a value type, but its address is taken, so it should be varrefed in TS.
	val := MyStruct{MyInt: 10}
	ptrToVal := &val // Makes NeedsVarRefAccess(val) true

	// Accessing field on varrefed value type: Should generate val.value.MyInt
	val.MyInt = 20

	// Scenario 2: Pointer type
	// We never take the address of ptr so it should not be varrefed.
	ptr := &MyStruct{MyInt: 30}

	// Accessing field on pointer type: Should generate ptr.MyInt
	ptr.MyInt = 40
	println("ptr.MyInt:", ptr.MyInt) // Expected: 40

	// Accessing pointer value, should use .value
	println("ptrToVal.MyInt:", ptrToVal.MyInt)

	myIntVal := ptrToVal.MyInt
	println("myIntVal:", myIntVal)
}
