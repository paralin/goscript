package main

type MyInterface interface {
	Method()
}

type MyStruct struct {
	PointerField   *int
	InterfaceField MyInterface
}

func main() {
	s := MyStruct{}
	println(s.PointerField)
	println(s.InterfaceField)

	i := 10
	s.PointerField = &i
	println(s.PointerField)

	var mi MyInterface
	s.InterfaceField = mi
	println(s.InterfaceField)
}
