package main

func returnTwoValues() (int, string) {
	return 42, "hello"
}

func main() {
	var a int = 0
	var b string = ""

	// Create pointers - these will be properly boxed
	var pA *int = &a
	var pB *string = &b

	// This should trigger the "unhandled LHS expression in destructuring: *ast.StarExpr" error
	*pA, *pB = returnTwoValues()

	println("a:", a)
	println("b:", b)
}
