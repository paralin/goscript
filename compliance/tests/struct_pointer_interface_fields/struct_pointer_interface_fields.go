package main

type MyInterface interface {
	Method()
}

type MyStruct struct {
	PointerField   *int
	interfaceField MyInterface
}

func main() {
	s := MyStruct{}
	println(s.PointerField == nil)
	println(s.interfaceField == nil)

	i := 10
	s.PointerField = &i
	println(s.PointerField != nil)
	println(*s.PointerField)
	i = 15
	println(*s.PointerField)

	var mi MyInterface
	s.interfaceField = mi
	println(s.interfaceField == nil)
}
