package main

var counter = 0

func increment_counter() {
	counter++
	println("counter incremented to", counter)
}

func main() {
	for i := 0; i < 2; increment_counter() {
		println("loop iteration:", i)
		// We need to manually increment i or change the condition
		// to ensure the loop terminates as increment_counter() in post
		// does not affect 'i'.
		i++
	}
	println("done", "final counter:", counter)
}
