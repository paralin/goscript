package main

const (
	Pi    = 3.14
	Truth = false
	// TODO: Handle large integer constants and bit shifts exceeding JS number limits.
	// Big      = 1 << 60
	// Small    = Big >> 59 // Commented out as it depends on Big
	Greeting = "Hello, Constants!"
)

// Nothing has untyped null
var Nothing = interface{}(nil)

func main() {
	println(Pi)
	println(Truth)
	// println(Big) // Commented out until large integer handling is implemented
	// println(Small) // Commented out as it depends on Big
	println(Greeting)
}
