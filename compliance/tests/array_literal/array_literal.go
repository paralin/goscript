package main

func main() {
	// Test basic array literal
	var a [3]int = [3]int{1, 2, 3}
	println(a[0], a[1], a[2])

	// Test array literal with inferred length
	b := [...]string{"hello", "world"}
	println(b[0], b[1])

	// Test array literal with specific element initialization
	c := [5]int{1: 10, 3: 30}
	println(c[0], c[1], c[2], c[3], c[4])
}
