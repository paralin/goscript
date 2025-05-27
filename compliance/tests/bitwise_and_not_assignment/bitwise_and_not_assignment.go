package main

func main() {
	// Test the &^= operator (bit clear assignment)
	x := uint64(0x7FF0000000000000) // Some bits set
	mask := uint64(2047 << 52)      // Mask to clear

	println("Before:", x)
	x &^= mask // This should generate valid TypeScript
	println("After:", x)

	// Also test regular &^ operator
	y := uint64(0x7FF0000000000000)
	result := y &^ mask
	println("Result:", result)
}
