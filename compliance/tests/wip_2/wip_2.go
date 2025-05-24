package main

func main() {
	// Create a value
	x := 10

	// Create two pointers to the same value
	p1 := &x
	p2 := &x

	// These should be different pointers but point to the same value
	println("p1==p2:", p1 == p2)     // Should be false in our hardcoded case
	println("*p1==*p2:", *p1 == *p2) // Should be true

	// Now create a third pointer that's a copy of p1
	p3 := p1

	// These should be the same pointer
	println("p1==p3:", p1 == p3) // Should be true, but our solution would return false if p3 is varrefed differently

	// Now, let's create a scenario where one pointer is varrefed by taking its address
	// but we compare it to itself through a different path
	ptr := &x
	pp1 := &ptr // pp1 is varrefed because we take its address

	// Save pp1 in another variable but don't take its address
	// so the original ptr is varrefed but its copy is not
	savedPP1 := pp1

	// Take the address of pp1 to make it varrefed
	ppp1 := &pp1

	// Use ppp1 to make sure it's not considered unused
	println("Value through ppp1:", ***ppp1)

	// This is a comparison of the same pointer through different paths
	// but one path involves a varrefed variable and one doesn't
	println("pp1==savedPP1:", pp1 == savedPP1) // Should be true, but might be false with our current solution

	// Print dereferenced values to verify they're the same
	println("**pp1:", **pp1)
	println("**savedPP1:", **savedPP1)
}
