package main

type MyStruct struct {
	MyInt int
}

// SetValue sets the MyInt field (pointer receiver).
func (m *MyStruct) SetValue(v int) {
	m.MyInt = v
}

// GetValue returns the MyInt field (value receiver for verification).
func (m MyStruct) GetValue() int {
	return m.MyInt
}

func main() {
	// Create a struct value
	msValue := MyStruct{MyInt: 100}

	// === Method Call on Pointer Receiver via Value ===
	// Call the pointer-receiver method using the value variable.
	// Go implicitly takes the address of msValue (&msValue) to call SetValue.
	msValue.SetValue(200)

	// Verify the value was modified through the method call.
	// Expected: 200
	println("Value after pointer method call via value: Expected: 200, Actual:", msValue.GetValue())
}
