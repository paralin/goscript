package main

func main() {
	// Create a simple integer
	x := 10

	// p1 will be varrefed because its address is taken later
	p1 := &x

	// p2 is not varrefed as nothing takes its address
	p2 := &x

	// Take the address of p1 to make it varrefed
	pp1 := &p1

	// Compare the pointers - they should be different pointers
	// but point to the same value
	println("p1==p2:", p1 == p2)
	println("*p1==*p2:", *p1 == *p2)
	println("pp1 deref:", **pp1)
}
