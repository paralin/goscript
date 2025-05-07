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

	// --- Slices of Slices Tests ---
	println("--- Slices of Slices Tests ---")

	// Create a slice of slices of integers
	sliceOfSlices := [][]int{
		{1, 2, 3},
		{4, 5},
		{6, 7, 8, 9},
	}

	println("Length of sliceOfSlices:", len(sliceOfSlices))   // 3
	println("Capacity of sliceOfSlices:", cap(sliceOfSlices)) // 3

	// Access elements
	println("sliceOfSlices[0][1]:", sliceOfSlices[0][1]) // 2
	println("sliceOfSlices[1][0]:", sliceOfSlices[1][0]) // 4
	println("sliceOfSlices[2][3]:", sliceOfSlices[2][3]) // 9

	// Append to inner slice (should modify the inner slice)
	println("--- Append to inner slice ---")
	innerSlice := sliceOfSlices[1]                      // {4, 5}, len 2, cap 2
	println("Length of innerSlice:", len(innerSlice))   // 2
	println("Capacity of innerSlice:", cap(innerSlice)) // 2

	innerSlice = append(innerSlice, 50)                              // {4, 5, 50}
	println("Length of innerSlice after append:", len(innerSlice))   // 3
	println("Capacity of innerSlice after append:", cap(innerSlice)) // 4 (or more)
	println("innerSlice[2]:", innerSlice[2])                         // 50

	// Check if the original slice of slices reflects the change (it should, as innerSlice is a view)
	// Note: Appending to innerSlice might reallocate its underlying array if capacity is exceeded.
	// If reallocated, the original sliceOfSlices will *not* see the change at that index.
	// This test case specifically checks the scenario where the append happens within the original capacity
	// or if the reallocation behavior is correctly handled by GoScript.
	// For this simple case, appending 50 to {4, 5} will likely cause reallocation.
	// Let's test appending within capacity first.

	// Create a slice of slices where inner slice has capacity for append
	sliceOfSlicesWithCap := [][]int{
		{1, 2, 3},
		make([]int, 2, 5), // {0, 0}, len 2, cap 5
		{6, 7, 8, 9},
	}
	sliceOfSlicesWithCap[1][0] = 40
	sliceOfSlicesWithCap[1][1] = 50

	println("--- Append to inner slice with capacity ---")
	innerSliceWithCap := sliceOfSlicesWithCap[1]                      // {40, 50}, len 2, cap 5
	println("Length of innerSliceWithCap:", len(innerSliceWithCap))   // 2
	println("Capacity of innerSliceWithCap:", cap(innerSliceWithCap)) // 5

	innerSliceWithCap = append(innerSliceWithCap, 60)                              // {40, 50, 60}
	println("Length of innerSliceWithCap after append:", len(innerSliceWithCap))   // 3
	println("Capacity of innerSliceWithCap after append:", cap(innerSliceWithCap)) // 5
	println("innerSliceWithCap[2]:", innerSliceWithCap[2])                         // 60

	// Check if the original slice of slices reflects the change (it should, as append was within capacity)
	println("sliceOfSlicesWithCap[1][2]:", sliceOfSlicesWithCap[1][:3][2]) // 60

	// Append to inner slice exceeding capacity
	println("--- Append to inner slice exceeding capacity ---")
	innerSliceExceedCap := sliceOfSlices[0]                               // {1, 2, 3}, len 3, cap 3
	println("Length of innerSliceExceedCap:", len(innerSliceExceedCap))   // 3
	println("Capacity of innerSliceExceedCap:", cap(innerSliceExceedCap)) // 3

	innerSliceExceedCap = append(innerSliceExceedCap, 10, 20)                          // {1, 2, 3, 10, 20} - will reallocate
	println("Length of innerSliceExceedCap after append:", len(innerSliceExceedCap))   // 5
	println("Capacity of innerSliceExceedCap after append:", cap(innerSliceExceedCap)) // 6 (or more)
	println("innerSliceExceedCap[3]:", innerSliceExceedCap[3])                         // 10
	println("innerSliceExceedCap[4]:", innerSliceExceedCap[4])                         // 20

	// Check if the original slice of slices reflects the change (it should NOT, due to reallocation)
	// The original sliceOfSlices[0] should still be {1, 2, 3}
	println("Original sliceOfSlices[0] after inner append:", sliceOfSlices[0][0], sliceOfSlices[0][1], sliceOfSlices[0][2]) // 1 2 3

	// Slicing a slice of slices
	println("--- Slicing a slice of slices ---")
	subSliceOfSlices := sliceOfSlices[1:3]                          // {{4, 5}, {6, 7, 8, 9}}, len 2, cap 2
	println("Length of subSliceOfSlices:", len(subSliceOfSlices))   // 2
	println("Capacity of subSliceOfSlices:", cap(subSliceOfSlices)) // 2
	println("subSliceOfSlices[0][0]:", subSliceOfSlices[0][0])      // 4
	println("subSliceOfSlices[1][2]:", subSliceOfSlices[1][2])      // 8

	// Modify element in sub-slice of slices (should affect original)
	println("--- Modify element in sub-slice of slices ---")
	subSliceOfSlices[0][1] = 55
	println("sliceOfSlices[1][1] after sub-slice modification:", sliceOfSlices[1][1]) // 55

	// Append a new slice to the slice of slices
	println("--- Append a new slice to slice of slices ---")
	sliceOfSlices = append(sliceOfSlices, []int{100, 110})
	println("Length of sliceOfSlices after append:", len(sliceOfSlices))   // 4
	println("Capacity of sliceOfSlices after append:", cap(sliceOfSlices)) // 6 (or more)
	println("sliceOfSlices[3][0]:", sliceOfSlices[3][0])                   // 100

	// Append an existing slice to the slice of slices
	println("--- Append an existing slice to slice of slices ---")
	existingSlice := []int{200, 210}
	sliceOfSlices = append(sliceOfSlices, existingSlice)
	println("Length of sliceOfSlices after appending existing:", len(sliceOfSlices))   // 5
	println("Capacity of sliceOfSlices after appending existing:", cap(sliceOfSlices)) // 6 (or more)
	println("sliceOfSlices[4][1]:", sliceOfSlices[4][1])                               // 210

	// Modify the appended existing slice (should NOT affect the slice in sliceOfSlices if it was copied)
	// Go's append copies the slice header, but the underlying array is shared unless reallocation occurs.
	// Modifying existingSlice *after* appending it should not affect the copy in sliceOfSlices
	// unless they still share the underlying array and the modification is within the shared capacity.
	// Let's test this carefully.
	println("--- Modify appended existing slice ---")
	existingSlice[0] = 205
	println("sliceOfSlices[4][0] after modifying existingSlice:", sliceOfSlices[4][0]) // Should still be 200 if copied or shared but not modified at index 0

	// If we modify an element in the slice within sliceOfSlices, it *should* affect the original existingSlice
	// if they share the underlying array.
	println("--- Modify slice within sliceOfSlices ---")
	sliceOfSlices[4][1] = 215
	println("existingSlice[1] after modifying slice within sliceOfSlices:", existingSlice[1]) // Should be 215

	// Create a slice of slices using make
	println("--- Make slice of slices ---")
	makeSliceOfSlices := make([][]int, 2, 4)                          // len 2, cap 4
	println("Length of makeSliceOfSlices:", len(makeSliceOfSlices))   // 2
	println("Capacity of makeSliceOfSlices:", cap(makeSliceOfSlices)) // 4

	// Initialize inner slices
	makeSliceOfSlices[0] = []int{1000, 2000}
	makeSliceOfSlices[1] = make([]int, 1, 3)
	makeSliceOfSlices[1][0] = 3000

	println("makeSliceOfSlices[0][1]:", makeSliceOfSlices[0][1]) // 2000
	println("makeSliceOfSlices[1][0]:", makeSliceOfSlices[1][0]) // 3000

	// Append a new inner slice
	makeSliceOfSlices = append(makeSliceOfSlices, []int{4000, 5000})
	println("Length of makeSliceOfSlices after append:", len(makeSliceOfSlices))   // 3
	println("Capacity of makeSliceOfSlices after append:", cap(makeSliceOfSlices)) // 4
	println("makeSliceOfSlices[2][1]:", makeSliceOfSlices[2][1])                   // 5000

	// Append another new inner slice (should exceed capacity and reallocate outer slice)
	makeSliceOfSlices = append(makeSliceOfSlices, []int{6000})
	println("Length of makeSliceOfSlices after second append:", len(makeSliceOfSlices))   // 4
	println("Capacity of makeSliceOfSlices after second append:", cap(makeSliceOfSlices)) // 8 (or more)
	println("makeSliceOfSlices[3][0]:", makeSliceOfSlices[3][0])                          // 6000

	// Nil slice of slices
	println("--- Nil slice of slices ---")
	var nilSliceOfSlices [][]int
	println("Nil slice of slices len:", len(nilSliceOfSlices)) // 0
	println("Nil slice of slices cap:", cap(nilSliceOfSlices)) // 0

	// Append to nil slice of slices
	nilSliceOfSlices = append(nilSliceOfSlices, []int{10000})
	println("Length of nilSliceOfSlices after append:", len(nilSliceOfSlices))   // 1
	println("Capacity of nilSliceOfSlices after append:", cap(nilSliceOfSlices)) // 1 (or more)
	println("nilSliceOfSlices[0][0]:", nilSliceOfSlices[0][0])                   // 10000

	// Append another slice to the nil slice of slices
	nilSliceOfSlices = append(nilSliceOfSlices, []int{20000, 30000})
	println("Length of nilSliceOfSlices after second append:", len(nilSliceOfSlices))   // 2
	println("Capacity of nilSliceOfSlices after second append:", cap(nilSliceOfSlices)) // 2 (or more)
	println("nilSliceOfSlices[1][1]:", nilSliceOfSlices[1][1])                          // 30000

	// Empty slice of slices (not nil)
	println("--- Empty slice of slices ---")
	emptySliceOfSlices := make([][]int, 0)
	println("Empty slice of slices len:", len(emptySliceOfSlices)) // 0
	println("Empty slice of slices cap:", cap(emptySliceOfSlices)) // 0 (or more, implementation dependent)

	// Append to empty slice of slices
	emptySliceOfSlices = append(emptySliceOfSlices, []int{40000})
	println("Length of emptySliceOfSlices after append:", len(emptySliceOfSlices))   // 1
	println("Capacity of emptySliceOfSlices after append:", cap(emptySliceOfSlices)) // 1 (or more)
	println("emptySliceOfSlices[0][0]:", emptySliceOfSlices[0][0])                   // 40000
}
