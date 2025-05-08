package main

func main() {
	println("Starting loop")
	for i := 0; i < 3; i++ {
		println("Iteration:", i)
	}
	println("Loop finished")

	println("Starting loop")
	x := 0
	for range 5 {
		println("Iteration:", x)
		x++
	}
	println("Loop finished")
}
