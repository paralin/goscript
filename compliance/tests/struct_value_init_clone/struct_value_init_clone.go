package main

type Point struct {
	X int
	Y int
}

func main() {
	// Initialize directly
	p1 := Point{X: 1, Y: 2}
	println("p1:", p1.X, p1.Y)

	// Assign to another variable (should trigger clone)
	p2 := p1
	p2.X = 10 // Modify the copy

	// Print both to show they are independent
	println("p1 after p2 mod:", p1.X, p1.Y)
	println("p2:", p2.X, p2.Y)

	// Initialize via variable assignment
	v := Point{X: 3, Y: 4}
	p3 := v   // Should trigger clone
	p3.Y = 40 // Modify the copy

	println("v after p3 mod:", v.X, v.Y)
	println("p3:", p3.X, p3.Y)
}
