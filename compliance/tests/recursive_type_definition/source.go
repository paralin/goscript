package main

type A interface {
	MethodA(a A)
}

type B struct{}

func (b *B) MethodB(valB *B) {}

// It's also possible with mutually recursive types
type C interface {
	MethodC(d D)
}

type D interface {
	MethodD(c C)
}

func main() {
	// This code is not meant to be run,
	// but to test the type definition generation.
	// println("recursive type definition test") // Commented out for type-checking only test
}
