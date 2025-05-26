package main

func returnTwoValues() (int, error) {
	return 42, nil
}

func main() {
	// Test destructuring assignment with trailing comma issue
	// This should generate: [nref] = returnTwoValues()
	// Not: [nref, ] = returnTwoValues()
	var nref int
	nref, _ = returnTwoValues()

	println("nref:", nref)
}
