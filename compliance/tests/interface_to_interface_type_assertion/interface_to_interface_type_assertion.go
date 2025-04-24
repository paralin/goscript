package main

type MyInterface interface {
	Method1() int
}

type MyStruct struct {
	Value int
}

func (m MyStruct) Method1() int {
	return m.Value
}

type MyOtherInterface interface {
	Method1() int
}

func main() {
	var i MyInterface
	s := MyStruct{Value: 10}
	i = s

	_, ok := i.(MyOtherInterface)
	if ok {
		println("Type assertion successful")
	} else {
		println("Type assertion failed")
	}
}
