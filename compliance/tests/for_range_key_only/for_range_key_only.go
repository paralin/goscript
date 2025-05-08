package main

func main() {
	s := []int{10, 20, 30}
	println("Looping over slice (key only):")
	for i := range s {
		println(i)
	}
	// Expected output:
	// 0
	// 1
	// 2

	a := [2]string{"alpha", "beta"}
	println("Looping over array (key only):")
	for k := range a {
		println(k)
	}
	// Expected output:
	// 0
	// 1
}
