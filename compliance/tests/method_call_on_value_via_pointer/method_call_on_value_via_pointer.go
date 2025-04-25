package main

type MyStruct struct {
	MyInt int
}

// GetValue returns the MyInt field (value receiver).
func (m MyStruct) GetValue() int {
	return m.MyInt
}

func main() {
	// Create a struct value
	msValue := MyStruct{MyInt: 100}
	// Create a pointer to the struct value
	msPointer := &msValue

	// === Method Call on Value Receiver via Pointer ===
	// Call the value-receiver method using the pointer variable.
	// Go implicitly dereferences msPointer to call GetValue on the value.
	// Expected: 100
	println("Value via pointer call: Expected: 100, Actual:", msPointer.GetValue())

	// Modify the value through the original value variable
	msValue.MyInt = 200

	// The pointer still points to the modified value
	// Expected: 200
	println("Value via pointer call after modification: Expected: 200, Actual:", msPointer.GetValue())
}
