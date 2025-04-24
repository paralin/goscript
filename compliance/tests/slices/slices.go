package main

func main() {
	// Create a slice of integers with length 5 and capacity 10
	s := make([]int, 5, 10)
	println(len(s))
	println(cap(s))

	// Create a slice of strings with length 3
	s2 := make([]string, 3)
	println(len(s2))
	println(cap(s2))

	// Assign values
	s[0] = 10
	s[4] = 20
	s2[1] = "hello"

	println(s[0])
	println(s[4])
	println(s2[1])
}
