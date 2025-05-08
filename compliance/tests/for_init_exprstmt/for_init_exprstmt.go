package main

func init_func() {
	println("init_func called")
}

func main() {
	// Using a function call in the for loop's init statement
	// The condition is false to prevent the loop body from executing during the test,
	// focusing only on the init part's translation and execution.
	for init_func(); false; {
		println("loop body (should not be printed)")
	}
	println("done")
}
