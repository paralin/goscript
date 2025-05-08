package main

type MyStruct struct {
	Value int
}

func main() {
	s1 := MyStruct{Value: 10}
	var p *MyStruct
	p = &MyStruct{Value: 20} // Initialize p to point to something

	// This assignment should trigger the .clone() on s1
	// because s1 is a struct and *p is being assigned.
	*p = s1

	println(p.Value) // Expected: 10

	// Modify s1 to ensure p is a clone and not a reference
	s1.Value = 30
	println(p.Value) // Expected: 10 (still, due to clone)

	// Test assignment from a pointer to a struct (should not clone)
	s2 := &MyStruct{Value: 40}
	p2 := &MyStruct{Value: 50}
	*p2 = *s2         // Assigning the struct pointed to by s2 to the struct pointed to by p2
	println(p2.Value) // Expected: 40

	s2.Value = 60     // Modify original s2
	println(p2.Value) // Expected: 40 (because *s2 was cloned implicitly by Go's value semantics for struct assignment)
	// GoScript should replicate this by cloning if the RHS is a struct value.
	// In *p2 = *s2, *s2 is a struct value.

	// Test assignment of a struct from a function call
	s3 := MyStruct{Value: 70}
	p3 := &MyStruct{Value: 80}
	*p3 = getStruct()
	println(p3.Value) // Expected: 100
	println(s3.Value) // Expected: 70

	// Test assignment of a struct from a pointer returned by a function call
	p4 := &MyStruct{Value: 90}
	*p4 = *getStructPointer()
	println(p4.Value) // Expected: 110
}

func getStruct() MyStruct {
	return MyStruct{Value: 100}
}

func getStructPointer() *MyStruct {
	return &MyStruct{Value: 110}
}
