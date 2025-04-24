package main

func multipleReturnValues() (int, string, bool) {
	return 42, "hello", true
}

func main() {
	a, b, c := multipleReturnValues()
	println(a)
	println(b)
	println(c)

	x, _, z := multipleReturnValues()
	println(x)
	println(z)

	_, y, _ := multipleReturnValues()
	println(y)
}
