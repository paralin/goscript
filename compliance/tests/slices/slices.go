package main

func main() {
	// --- Original Tests ---
	println("--- Original Tests ---")
	// Create a slice of integers with length 5 and capacity 10
	s := make([]int, 5, 10)
	println(len(s)) // 5
	println(cap(s)) // 10

	// Create a slice of strings with length 3
	s2 := make([]string, 3)
	println(len(s2)) // 3
	println(cap(s2)) // 3

	// Assign values
	s[0] = 10
	s[4] = 20
	s2[1] = "hello"

	println(s[0])  // 10
	println(s[4])  // 20
	println(s2[1]) // hello

	// --- New Tests ---
	println("--- New Tests ---")

	// Create slice from array literal
	arrLit := [5]int{1, 2, 3, 4, 5}
	sliceFromLit := arrLit[:]
	println(len(sliceFromLit)) // 5
	println(cap(sliceFromLit)) // 5
	println(sliceFromLit[0])   // 1
	println(sliceFromLit[4])   // 5

	// Create slice from array variable
	arrVar := [4]string{"a", "b", "c", "d"}
	sliceFromVar := arrVar[:]
	println(len(sliceFromVar)) // 4
	println(cap(sliceFromVar)) // 4
	println(sliceFromVar[0])   // a
	println(sliceFromVar[3])   // d

	// Create slice with specific indices
	sliceIndices := arrVar[1:3] // ["b", "c"]
	println(len(sliceIndices))  // 2
	println(cap(sliceIndices))  // 3 (cap is from start index to end of original array)
	println(sliceIndices[0])    // b
	println(sliceIndices[1])    // c

	// Create slice with 0 len/cap and append
	println("--- Zero len/cap append ---")
	zeroSlice := make([]int, 0, 0)
	println(len(zeroSlice)) // 0
	println(cap(zeroSlice)) // 0
	zeroSlice = append(zeroSlice, 100)
	println(len(zeroSlice)) // 1
	println(cap(zeroSlice)) // 1 (or more, implementation dependent)
	println(zeroSlice[0])   // 100
	zeroSlice = append(zeroSlice, 200)
	println(len(zeroSlice)) // 2
	println(cap(zeroSlice)) // 2 (or more)
	println(zeroSlice[1])   // 200

	// Modify slice, check original array
	println("--- Modify slice, check array ---")
	modArr := [3]int{10, 20, 30}
	modSlice := modArr[:]
	modSlice[1] = 25     // Modify slice
	println(modArr[1])   // 25 (original array should be modified)
	println(modSlice[1]) // 25

	// Modify array, check slice
	println("--- Modify array, check slice ---")
	modArr[0] = 15       // Modify array
	println(modArr[0])   // 15
	println(modSlice[0]) // 15 (slice should reflect change)

	// Append to sub-slice within capacity
	println("--- Append sub-slice w/in capacity ---")
	appendArr := [5]int{1, 2, 3, 4, 5}
	appendSlice1 := appendArr[0:2]           // len 2, cap 5; [1, 2]
	println(len(appendSlice1))               // 2
	println(cap(appendSlice1))               // 5
	appendSlice2 := append(appendSlice1, 99) // Appends within original capacity
	println(len(appendSlice2))               // 3
	println(cap(appendSlice2))               // 5
	println(appendSlice2[2])                 // 99
	println(appendArr[2])                    // 99 (original array modified)

	// Append to sub-slice exceeding capacity
	println("--- Append sub-slice exceed capacity ---")
	appendSlice3 := appendArr[3:5]            // len 2, cap 2; [4, 5]
	println(len(appendSlice3))                // 2
	println(cap(appendSlice3))                // 2
	appendSlice4 := append(appendSlice3, 101) // Appends beyond original capacity
	println(len(appendSlice4))                // 3
	println(cap(appendSlice4))                // 4 (or more, new underlying array)
	println(appendSlice4[0])                  // 4
	println(appendSlice4[1])                  // 5
	println(appendSlice4[2])                  // 101
	// Original array should NOT be modified beyond its bounds by this append
	println(appendArr[0]) // 1
	println(appendArr[1]) // 2
	println(appendArr[2]) // 99 (from previous append)
	println(appendArr[3]) // 4
	println(appendArr[4]) // 5

	// Slicing a slice
	println("--- Slicing a slice ---")
	baseSlice := []int{0, 10, 20, 30, 40, 50}
	subSlice1 := baseSlice[1:4] // [10, 20, 30], len 3, cap 5
	println(len(subSlice1))     // 3
	println(cap(subSlice1))     // 5
	println(subSlice1[0])       // 10
	subSlice2 := subSlice1[1:3] // [20, 30], len 2, cap 4 (cap from subSlice1's start)
	println(len(subSlice2))     // 2
	println(cap(subSlice2))     // 4
	println(subSlice2[0])       // 20
	println(subSlice2[1])       // 30
	subSlice2[0] = 22           // Modify sub-sub-slice
	println(subSlice1[1])       // 22 (subSlice1 modified)
	println(baseSlice[2])       // 22 (baseSlice modified)

	// Three-index slicing (if supported) - Check capacity
	println("--- Three-index slicing ---")
	threeIndexArr := [6]int{0, 1, 2, 3, 4, 5}
	threeIndexSlice := threeIndexArr[1:3:4] // [1, 2], len 2, cap 3 (4-1)
	println(len(threeIndexSlice))           // 2
	println(cap(threeIndexSlice))           // 3
	println(threeIndexSlice[0])             // 1
	println(threeIndexSlice[1])             // 2
	// Appending should modify original array up to new capacity limit
	threeIndexSlice = append(threeIndexSlice, 99)
	println(len(threeIndexSlice)) // 3
	println(cap(threeIndexSlice)) // 3
	println(threeIndexSlice[2])   // 99
	println(threeIndexArr[3])     // 99 (original modified)
	// Appending again should reallocate
	threeIndexSlice = append(threeIndexSlice, 101)
	println(len(threeIndexSlice)) // 4
	println(cap(threeIndexSlice)) // 6 (or more)
	println(threeIndexSlice[3])   // 101
	println(threeIndexArr[4])     // 4 (original NOT modified by reallocating append)

	// --- Additional Tests for Full Coverage ---
	println("--- Additional Tests ---")

	// Slice literal
	sliceLiteral := []int{10, 20, 30}
	println("Slice literal len:", len(sliceLiteral)) // 3
	println("Slice literal cap:", cap(sliceLiteral)) // 3
	println("Slice literal[1]:", sliceLiteral[1])    // 20

	// Nil slice
	var nilSlice []int
	println("Nil slice len:", len(nilSlice)) // 0
	println("Nil slice cap:", cap(nilSlice)) // 0
	nilSlice = append(nilSlice, 5)
	println("Append to nil slice len:", len(nilSlice)) // 1
	println("Append to nil slice cap:", cap(nilSlice)) // 1 (or more)
	println("Append to nil slice[0]:", nilSlice[0])    // 5

	// Out-of-bounds indexing (should panic)
	// Note: Testing panics in compliance tests requires specific handling in the test runner.
	// For now, we'll add the code but expect it to fail if panics are not caught.
	// The runner should ideally catch these panics and verify the error type/message.

	// println("--- Testing out-of-bounds panic ---")
	// smallSlice := []int{1}
	// println(smallSlice[1]) // Index out of bounds (len 1, cap 1) - should panic
	// smallSlice[1] = 10     // Index out of bounds - should panic
	// println(smallSlice[-1]) // Negative index - should panic
}
