package main

func main() {
	// y is boxed because p1 takes its address
	var y int = 15

	// p1 is boxed because p1_boxer takes its address
	var p1 *int = nil
	var p1_boxer **int = &p1 // Ensure p1 is boxed
	_ = p1_boxer

	// Expected TS: p1.value = y
	p1 = &y

	// Dereferencing p1 (boxed variable) to access y (boxed variable)
	// Go: println(*p1)
	// Expected TS for same behavior: console.log(p1.value.value)
	// We access p1 which should be p1.value. Then we dereference that, which should be p1.value.value.
	println(*p1)

	// Set the value
	*p1 = 20
}
