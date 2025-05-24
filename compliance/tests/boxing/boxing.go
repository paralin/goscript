package main

// Based on design/VAR_REFS.md

func main() {
	println("setting x to 10")
	var x int = 10 // x is varrefed as p1 takes the address

	var p1 *int = &x    // p1 is varrefed as p2 takes the address
	var p2 **int = &p1  // p2 is varrefed as p3 takes the address
	var p3 ***int = &p2 // p3 is not varrefed as nothing takes its address

	println("***p3 ==", ***p3)
	println()

	println("setting ***p3 to 12")
	***p3 = 12
	println("***p3 ==", ***p3)
	println()

	println("setting y to 15, p1 to &y")
	// should be: let y: $.VarRef<number> = $.varRef(15)
	var y int = 15 // y is varrefed as p1 takes the address
	// should be: p1.value = y
	p1 = &y

	println("***p3 ==", ***p3)
	println()
}
