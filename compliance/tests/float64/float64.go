package main

func main() {
	var a float64 = 1.23
	b := 4.56
	var c float64

	c = a + b
	println("a + b =", c)

	c = a - b
	println("a - b =", c)

	c = a * b
	println("a * b =", c)

	c = a / b
	println("a / b =", c)

	// Assignment
	d := 7.89
	c = d
	println("c =", c)

	// More complex expression
	e := (a + b) * (c - d) / a
	println("(a + b) * (c - d) / a =", e)
}
