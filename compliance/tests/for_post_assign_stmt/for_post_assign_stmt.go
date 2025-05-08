package main

func main() {
	var x int
	// The post statement 'x = i' is an AssignStmt
	for i := 0; i < 3; x = i {
		println("looping, i:", i, "x_before_post:", x)
		// Increment i inside the loop body to ensure the loop progresses
		// and to clearly separate the loop's own increment from the post statement.
		i++
	}
	println("final x:", x)
}
