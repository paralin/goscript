package main

func main() {
	var x int = 10 // x is boxed as p1 takes the address

	var p1 *int = &x    // p1 is boxed as p2 takes the address
	var p2 **int = &p1  // p2 is boxed as p3 takes the address
	var p3 ***int = &p2 // p3 is not boxed as nothing takes its address
	_ = p3

	// should be: let y: $.Box<number> = $.box(15)
	var y int = 15 // y is boxed as p1 takes the address
	// should be: p1.value = y
	p1 = &y

	println("***p3 ==", ***p3)
}
