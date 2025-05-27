package main

// Test case that replicates the undefined type error
// The issue: fmt: $.VarRef<fmt>; where fmt type is undefined

// This should generate a proper type reference, not an undefined fmt type
type formatter struct {
	wid         int
	prec        int
	widPresent  bool
	precPresent bool
	minus       bool
	plus        bool
	sharp       bool
	space       bool
	zero        bool
	plusV       bool
	sharpV      bool
}

type printer struct {
	buf []byte
	arg interface{}
	// This line causes the issue: fmt: $.VarRef<fmt>; where fmt is undefined
	// Should generate proper type reference
	fmt formatter
}

func (p *printer) init() {
	p.fmt = formatter{}
}

func (p *printer) format(verb rune) {
	// Use the formatter
	if p.fmt.minus {
		println("minus flag set")
	}
	if p.fmt.plus {
		println("plus flag set")
	}
}

func main() {
	p := &printer{}
	p.init()
	p.format('d')
	println("Formatter test completed")
}
