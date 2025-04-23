package main

type MyStruct struct {
	MyInt    int
	MyString string
}

// GetMyString returns the MyString field.
func (m MyStruct) GetMyString() string {
	return m.MyString
}

func main() {
	ms := MyStruct{MyInt: 1, MyString: "bar"}
	println("Method call on value: Expected: bar, Actual:", ms.GetMyString())
}
