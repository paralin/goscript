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

func main() {
	var i MyInterface
	s := MyStruct{Value: 10}
	i = s

	_, ok := i.(MyStruct)
	if ok {
		println("Type assertion successful")
	} else {
		println("Type assertion failed")
	}

	// try a second time since this generates something different when using = and not :=
	_, ok = i.(*MyStruct)
	if ok {
		println("Type assertion successful")
	} else {
		// expected
		println("Type assertion failed")
	}
}
