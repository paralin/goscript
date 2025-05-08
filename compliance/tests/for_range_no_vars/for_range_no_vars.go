package main

func main() {
	s := []int{10, 20, 30}
	println("Looping over slice (no vars):")
	count := 0
	for range s {
		count++
	}
	println(count) // Expected output: 3

	a := [2]string{"alpha", "beta"}
	println("Looping over array (no vars):")
	arrCount := 0
	for range a {
		println(a[arrCount])
		arrCount++
	}
	println(arrCount) // Expected output: 2

	println("Ranging over number (no vars):")
	numCount := 0
	for range 5 {
		numCount++
	}
	println(numCount) // Expected output: 5
}
