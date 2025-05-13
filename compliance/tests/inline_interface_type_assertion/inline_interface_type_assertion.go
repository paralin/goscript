package main

type Greeter struct{}

func (g Greeter) Greet() string {
	return "Hello from Greeter"
}

type Stringer interface {
	String() string
}

type MyStringer struct{}

func (ms MyStringer) String() string {
	return "MyStringer implementation"
}

func main() {
	var i interface{}
	i = Greeter{}

	// Successful type assertion to an inline interface
	g, ok := i.(interface{ Greet() string })
	if ok {
		println("Greet assertion successful:", g.Greet())
	} else {
		println("Greet assertion failed")
	}

	// Failing type assertion to a different inline interface
	s, ok2 := i.(interface{ NonExistentMethod() int })
	if ok2 {
		println("NonExistentMethod assertion successful (unexpected):", s.NonExistentMethod())
	} else {
		println("NonExistentMethod assertion failed as expected")
	}

	// Successful type assertion to a named interface, where the asserted value also implements an inline interface method
	var j interface{}
	j = MyStringer{}

	// Assert 'j' (which holds MyStringer) to an inline interface that MyStringer satisfies.
	inlineMs, ok4 := j.(interface{ String() string })
	if ok4 {
		println("Inline String assertion successful:", inlineMs.String())
	} else {
		println("Inline String assertion failed")
	}

	// Test case: variable of named interface type, asserted to inline interface
	var k Stringer
	k = MyStringer{}

	inlineK, ok5 := k.(interface{ String() string })
	if ok5 {
		println("k.(interface{ String() string }) successful:", inlineK.String())
	} else {
		println("k.(interface{ String() string }) failed")
	}

	// Test case: nil value of an inline interface type assigned to interface{}
	var l any = (*struct {
		Name string
	})(nil)

	ptr, ok6 := l.(*struct{ Name string })
	if ok6 {
		if ptr == nil {
			println("l.(*struct{ Name string }) successful, ptr is nil as expected")
		} else {
			println("l.(*struct{ Name string }) successful, but ptr is not nil (unexpected)")
		}
	} else {
		println("l.(*struct{ Name string }) failed (unexpected)")
	}
}
