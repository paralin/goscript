package main

func main() {
	println("--- Testing make() with slices ---")

	// Test 1: Basic make with length only
	println("--- Basic make with length only ---")
	s1 := make([]int, 5)
	println("len(s1):", len(s1)) // 5
	println("cap(s1):", cap(s1)) // 5

	// Test 2: Make with length and capacity
	println("--- Make with length and capacity ---")
	s2 := make([]int, 3, 10)
	println("len(s2):", len(s2)) // 3
	println("cap(s2):", cap(s2)) // 10

	// Test 3: Make bytes with zero length, large capacity
	println("--- Make bytes with zero length, large capacity ---")
	b1 := make([]byte, 0, 100000)
	println("len(b1):", len(b1)) // 0
	println("cap(b1):", cap(b1)) // 100000

	// Test 4: Make bytes with length and capacity
	println("--- Make bytes with length and capacity ---")
	b2 := make([]byte, 10, 50)
	println("len(b2):", len(b2)) // 10
	println("cap(b2):", cap(b2)) // 50

	// Test 5: Make with zero capacity
	println("--- Make with zero capacity ---")
	s3 := make([]int, 0, 0)
	println("len(s3):", len(s3)) // 0
	println("cap(s3):", cap(s3)) // 0

	// Test 6: Make with equal length and capacity
	println("--- Make with equal length and capacity ---")
	s4 := make([]string, 7, 7)
	println("len(s4):", len(s4)) // 7
	println("cap(s4):", cap(s4)) // 7

	// Test 7: Append to slice with extra capacity
	println("--- Append to slice with extra capacity ---")
	s5 := make([]int, 2, 5)
	s5[0] = 10
	s5[1] = 20
	println("Before append - len:", len(s5), "cap:", cap(s5)) // len: 2, cap: 5
	s5 = append(s5, 30)
	println("After append - len:", len(s5), "cap:", cap(s5)) // len: 3, cap: 5
	println("s5[2]:", s5[2])                                 // 30

	// Test 8: Append to bytes with extra capacity
	println("--- Append to bytes with extra capacity ---")
	b3 := make([]byte, 1, 10)
	b3[0] = 65                                                // 'A'
	println("Before append - len:", len(b3), "cap:", cap(b3)) // len: 1, cap: 10
	b3 = append(b3, 66)                                       // 'B'
	println("After append - len:", len(b3), "cap:", cap(b3))  // len: 2, cap: 10
	println("b3[0]:", b3[0])                                  // 65
	println("b3[1]:", b3[1])                                  // 66

	// Test 9: Large capacity slice
	println("--- Large capacity slice ---")
	large := make([]int, 5, 1000000)
	println("len(large):", len(large)) // 5
	println("cap(large):", cap(large)) // 1000000

	// Test 10: Zero length, various capacities
	println("--- Zero length, various capacities ---")
	z1 := make([]byte, 0, 1)
	z2 := make([]byte, 0, 100)
	z3 := make([]byte, 0, 10000)
	println("z1 - len:", len(z1), "cap:", cap(z1)) // len: 0, cap: 1
	println("z2 - len:", len(z2), "cap:", cap(z2)) // len: 0, cap: 100
	println("z3 - len:", len(z3), "cap:", cap(z3)) // len: 0, cap: 10000

	// Test 11: Slice operations on made slices
	println("--- Slice operations on made slices ---")
	s6 := make([]int, 10, 20)
	for i := 0; i < 10; i++ {
		s6[i] = i * 10
	}
	sub := s6[2:5]                                    // Should have len=3, cap=18 (20-2)
	println("sub - len:", len(sub), "cap:", cap(sub)) // len: 3, cap: 18
	println("sub[0]:", sub[0])                        // 20
	println("sub[2]:", sub[2])                        // 40

	// Test 12: String slices with capacity
	println("--- String slices with capacity ---")
	str := make([]string, 3, 8)
	str[0] = "hello"
	str[1] = "world"
	str[2] = "test"
	println("str - len:", len(str), "cap:", cap(str)) // len: 3, cap: 8
	println("str[1]:", str[1])                        // world

	println("--- All tests completed ---")
}
