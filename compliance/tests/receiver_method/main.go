package main

type MyStruct struct {
	Value int
}

// Method that uses the receiver
func (m *MyStruct) UsesReceiver() int {
	return m.Value
}

// Method that doesn't use the receiver
func (m *MyStruct) DoesNotUseReceiver() int {
	return 42
}

func main() {
	s := &MyStruct{Value: 10}
	println(s.UsesReceiver())
	println(s.DoesNotUseReceiver())
}
