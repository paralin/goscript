package main

func returnsOneIntOneBool() (int, bool) {
	return 7, true
}

func main() {
	var i int
	println("initial i:", i) /* Use i to avoid unused error before := */

	// i already exists from the var declaration above.
	// err is a new variable being declared.
	i, err := returnsOneIntOneBool()

	println("after assign i:", i) // Use i
	if err {                      // Use err
		println("err is true")
	} else {
		println("err is false")
	}
}
