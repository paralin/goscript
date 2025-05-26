package main

func getValues() (int, bool) {
	return 42, true
}

func main() {
	// This should trigger the error: multi-assignment in for loop init
	// where lhs has 2 variables but rhs has 1 expression that returns 2 values
	// but is not a map access
	for value, ok := getValues(); ok; {
		println("value:", value)
		break
	}

	println("done")
}
