package main

func returnTwoInts() (int, int) {
	return 42, 24
}

func returnIntAndString() (int, string) {
	return 42, "hello"
}

func main() {
	// Create arrays/slices to test index expressions in destructuring
	var intArray [2]int
	var stringSlice []string = make([]string, 2)

	// This should trigger the "unhandled LHS expression in destructuring: *ast.IndexExpr" error
	intArray[0], stringSlice[1] = returnIntAndString()

	println("intArray[0]:", intArray[0])
	println("stringSlice[1]:", stringSlice[1])

	// Test with more complex index expressions
	var matrix [2][2]int
	var i, j int = 0, 1

	matrix[i][j], intArray[1] = returnTwoInts()

	println("matrix[0][1]:", matrix[0][1])
	println("intArray[1]:", intArray[1])
}
