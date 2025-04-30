package main

func main() {
	var x int = 10

	var p1 *int = &x    // p1 is boxed as p2 takes its address
	var p2 **int = &p1  // p2 is boxed as p3 takes its address
	var p3 ***int = &p2 // p3 is not boxed as nothing takes its address

	println("**p3 ==", ***p3)

	var q1 *int = &x       // q1 is not boxed as nothing takes its address
	println("*q1 ==", *q1) // Should translate to q1!.value
}
