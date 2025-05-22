package main

func main() {
	// Test 1: Declaration and initialization of []byte
	var b1 []byte
	println("b1:", b1)

	b2 := []byte{72, 101, 108, 108, 111} // "Hello"
	println("b2:", b2)

	b3 := []byte("World") // Conversion from string literal
	println("b3:", b3)

	// Test 2: Assignment
	b1 = b2
	println("b1 after assignment:", b1)

	// Test 3: Conversion from string to []byte
	s := "GoScript"
	b4 := []byte(s)
	println("b4 from string:", b4)

	// Test 4: Conversion from []byte to string
	s2 := string(b2)
	println("s2 from bytes:", s2)

	// Test 5: Accessing elements
	println("b2[0]:", b2[0])
	b2[0] = 87 // Change 'H' to 'W'
	println("b2 after modification:", b2)
	println("s2 after b2 modification (should be 'Hello'):", s2) // Should not change s2

	// Test 6: len and cap
	println("len(b2):", len(b2), "cap(b2):", cap(b2))
	println("len(b3):", len(b3), "cap(b3):", cap(b3))

	// Test 7: append
	b5 := append(b2, 33, 33) // Append "!!"
	println("b5 after append:", b5)
	println("len(b5):", len(b5), "cap(b5):", cap(b5))

	b6 := append(b5, []byte(" GoScript")...)
	println("b6 after append slice:", b6)
	println("len(b6):", len(b6), "cap(b6):", cap(b6))
}
