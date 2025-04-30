package main

func main() {
	var x int = 10      // x is boxed as p1 takes the address
	var p1 *int = &x    // p1 is boxed as p2 takes the address
	var p2 **int = &p1  // p2 is boxed as p3 takes the address
	var p3 ***int = &p2 // p3 is not boxed as nothing takes its address

	println("***p3 before ==", ***p3)

	// Dereference multiple times, this should be:
	// Goal: p3!.value!.value!.value = 12
	// Current: p3!.value = 12
	// Issue: only the bottom-most level of the WriteStarExpr checks p3 for boxing generating .value
	// How do we know that *p3 needs .value?
	***p3 = 12
	println("***p3 after ==", ***p3)
}
