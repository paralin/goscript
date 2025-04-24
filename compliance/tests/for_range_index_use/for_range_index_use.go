package main

func main() {
	slice := []int{10, 20, 30, 40, 50}
	sum := 0
	for idx, val := range slice {
		sum += val
		println("Range idx:", idx, "val:", val)
	}
	println("Sum:", sum)
}
