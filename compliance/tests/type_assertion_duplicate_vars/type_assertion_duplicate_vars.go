package main

type Interface interface {
	Method() string
}

type ConcreteA struct{}

func (c ConcreteA) Method() string { return "A" }

type ConcreteB struct{}

func (c ConcreteB) Method() string { return "B" }

type Container struct {
	hasA bool
	hasB bool
}

func main() {
	var iface Interface = ConcreteA{}

	c := &Container{}

	// Multiple type assertions that should generate unique variable names
	_, c.hasA = iface.(ConcreteA)
	_, c.hasB = iface.(ConcreteB)

	println("hasA:", c.hasA)
	println("hasB:", c.hasB)
}
