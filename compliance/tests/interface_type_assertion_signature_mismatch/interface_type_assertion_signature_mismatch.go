//go:build doesntcompile

// The tag is necessary to get go test to ignore this file.
// Error: compliance/tests/interface_type_assertion_signature_mismatch/interface_type_assertion_signature_mismatch.go:26:14: impossible type assertion: no type can implement both github.com/paralin/goscript/compliance/tests/interface_type_assertion_signature_mismatch.InterfaceA and github.com/paralin/goscript/compliance/tests/interface_type_assertion_signature_mismatch.InterfaceB (conflicting types for DoSomething method)

package main

type InterfaceA interface {
	DoSomething(int) string
}

type InterfaceB interface {
	DoSomething(string) string
}

type MyStruct struct {
	Name string
}

func (m MyStruct) DoSomething(val int) string {
	println("MyStruct.DoSomething called")
	return "done"
}

func main() {
	var a InterfaceA
	s := MyStruct{Name: "TestStruct"}
	a = s

	// This assertion should fail at runtime because InterfaceB.DoSomething has a different signature
	_, ok := a.(InterfaceB)
	if ok {
		println("Type assertion to InterfaceB successful")
	} else {
		println("Type assertion to InterfaceB failed")
	}

	// This assertion should succeed
	_, ok = a.(InterfaceA)
	if ok {
		println("Type assertion to InterfaceA successful")
	} else {
		println("Type assertion to InterfaceA failed")
	}

	// Call the method on the asserted interface to ensure the generated code works
	// This is not strictly necessary for the type assertion test but good practice
	// if the assertion to InterfaceA succeeds.
	if assertedA, ok := a.(InterfaceA); ok {
		assertedA.DoSomething(123)
	}
}
