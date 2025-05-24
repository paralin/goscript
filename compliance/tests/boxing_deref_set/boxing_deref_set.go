package main

func main() {
	// y is varrefed because p1 takes its address
	var y int = 15

	// p1 is varrefed because p1_varRefer takes its address
	var p1 *int = nil
	var p1_varRefer **int = &p1 // Ensure p1 is varrefed
	_ = p1_varRefer

	// Expected TS: p1.value = y
	p1 = &y

	// Dereferencing p1 (varrefed variable) to access y (varrefed variable)
	// Go: println(*p1)
	// Expected TS for same behavior: console.log(p1.value.value)
	// We access p1 which should be p1.value. Then we dereference that, which should be p1.value.value.
	println(*p1)

	// Set the value
	*p1 = 20
}
