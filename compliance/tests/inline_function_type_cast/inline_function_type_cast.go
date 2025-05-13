package main

// 1. Create a type for a function
type Greeter func(name string) string

func main() {
	// 2. Create an inline variable with the inline function satisfying that type.
	theInlineVar := func(name string) string {
		return "Hello, " + name
	}

	// 3. Use Greeter(theInlineVar) to cast to the Greeter declared function type.
	castedGreeter := Greeter(theInlineVar)

	// 4. Call that
	println(castedGreeter("Inline World"))

	// Test with a different signature
	type Adder func(a, b int) int
	theInlineAdder := func(a, b int) int {
		return a + b
	}
	castedAdder := Adder(theInlineAdder)
	println(castedAdder(5, 7))
}
