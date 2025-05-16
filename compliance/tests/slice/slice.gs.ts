// Generated file based on slice.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	// --- Original Tests ---
	console.log("--- Original Tests ---")
	// Create a slice of integers with length 5 and capacity 10
	let s = $.makeSlice<number>(5, 10)
	console.log($.len(s)) // 5
	console.log($.cap(s)) // 10

	// Create a slice of strings with length 3
	let s2 = $.makeSlice<string>(3)
	console.log($.len(s2)) // 3
	console.log($.cap(s2)) // 3

	// Assign values
	s![0] = 10
	s![4] = 20
	s2![1] = "hello"

	console.log(s![0]) // 10
	console.log(s![4]) // 20
	console.log(s2![1]) // hello

	// --- New Tests ---
	console.log("--- New Tests ---")

	// Create slice from array literal
	let arrLit = $.arrayToSlice<number>([1, 2, 3, 4, 5])
	let sliceFromLit = $.goSlice(arrLit, undefined, undefined)
	console.log($.len(sliceFromLit)) // 5
	console.log($.cap(sliceFromLit)) // 5
	console.log(sliceFromLit![0]) // 1
	console.log(sliceFromLit![4]) // 5

	// Create slice from array variable
	let arrVar = $.arrayToSlice<string>(["a", "b", "c", "d"])
	let sliceFromVar = $.goSlice(arrVar, undefined, undefined)
	console.log($.len(sliceFromVar)) // 4
	console.log($.cap(sliceFromVar)) // 4
	console.log(sliceFromVar![0]) // a
	console.log(sliceFromVar![3]) // d

	// Create slice with specific indices
	let sliceIndices = $.goSlice(arrVar, 1, 3)
	console.log($.len(sliceIndices)) // 2
	console.log($.cap(sliceIndices)) // 3 (cap is from start index to end of original array)
	console.log(sliceIndices![0]) // b
	console.log(sliceIndices![1]) // c

	// Create slice with 0 len/cap and append
	console.log("--- Zero len/cap append ---")
	let zeroSlice = $.makeSlice<number>(0, 0)
	console.log($.len(zeroSlice)) // 0
	console.log($.cap(zeroSlice)) // 0
	zeroSlice = $.append(zeroSlice, 100)
	console.log($.len(zeroSlice)) // 1
	console.log($.cap(zeroSlice)) // 1 (or more, implementation dependent)
	console.log(zeroSlice![0]) // 100
	zeroSlice = $.append(zeroSlice, 200)
	console.log($.len(zeroSlice)) // 2
	console.log($.cap(zeroSlice)) // 2 (or more)
	console.log(zeroSlice![1]) // 200

	// Modify slice, check original array
	console.log("--- Modify slice, check array ---")
	let modArr = $.arrayToSlice<number>([10, 20, 30])
	let modSlice = $.goSlice(modArr, undefined, undefined)
	modSlice![1] = 25
	console.log(modArr![1]) // 25 (original array should be modified)
	console.log(modSlice![1]) // 25

	// Modify array, check slice
	console.log("--- Modify array, check slice ---")
	modArr![0] = 15
	console.log(modArr![0]) // 15
	console.log(modSlice![0]) // 15 (slice should reflect change)

	// Append to sub-slice within capacity
	console.log("--- Append sub-slice w/in capacity ---")
	let appendArr = $.arrayToSlice<number>([1, 2, 3, 4, 5])
	let appendSlice1 = $.goSlice(appendArr, 0, 2)
	console.log($.len(appendSlice1)) // 2
	console.log($.cap(appendSlice1)) // 5
	let appendSlice2 = $.append(appendSlice1, 99)
	console.log($.len(appendSlice2)) // 3
	console.log($.cap(appendSlice2)) // 5
	console.log(appendSlice2![2]) // 99
	console.log(appendArr![2]) // 99 (original array modified)

	// Append to sub-slice exceeding capacity
	console.log("--- Append sub-slice exceed capacity ---")
	let appendSlice3 = $.goSlice(appendArr, 3, 5)
	console.log($.len(appendSlice3)) // 2
	console.log($.cap(appendSlice3)) // 2
	let appendSlice4 = $.append(appendSlice3, 101)
	console.log($.len(appendSlice4)) // 3
	console.log($.cap(appendSlice4)) // 4 (or more, new underlying array)
	console.log(appendSlice4![0]) // 4
	console.log(appendSlice4![1]) // 5
	console.log(appendSlice4![2]) // 101
	// Original array should NOT be modified beyond its bounds by this append
	console.log(appendArr![0]) // 1
	console.log(appendArr![1]) // 2
	console.log(appendArr![2]) // 99 (from previous append)
	console.log(appendArr![3]) // 4
	console.log(appendArr![4]) // 5

	// Slicing a slice
	console.log("--- Slicing a slice ---")
	let baseSlice = $.arrayToSlice<number>([0, 10, 20, 30, 40, 50])
	let subSlice1 = $.goSlice(baseSlice, 1, 4)
	console.log($.len(subSlice1)) // 3
	console.log($.cap(subSlice1)) // 5
	console.log(subSlice1![0]) // 10
	let subSlice2 = $.goSlice(subSlice1, 1, 3)
	console.log($.len(subSlice2)) // 2
	console.log($.cap(subSlice2)) // 4
	console.log(subSlice2![0]) // 20
	console.log(subSlice2![1]) // 30
	subSlice2![0] = 22
	console.log(subSlice1![1]) // 22 (subSlice1 modified)
	console.log(baseSlice![2]) // 22 (baseSlice modified)

	// Three-index slicing (if supported) - Check capacity
	console.log("--- Three-index slicing ---")
	let threeIndexArr = $.arrayToSlice<number>([0, 1, 2, 3, 4, 5])
	let threeIndexSlice = $.goSlice(threeIndexArr, 1, 3, 4)
	console.log($.len(threeIndexSlice)) // 2
	console.log($.cap(threeIndexSlice)) // 3
	console.log(threeIndexSlice![0]) // 1
	console.log(threeIndexSlice![1]) // 2
	// Appending should modify original array up to new capacity limit
	threeIndexSlice = $.append(threeIndexSlice, 99)
	console.log($.len(threeIndexSlice)) // 3
	console.log($.cap(threeIndexSlice)) // 3
	console.log(threeIndexSlice![2]) // 99
	console.log(threeIndexArr![3]) // 99 (original modified)
	// Appending again should reallocate
	threeIndexSlice = $.append(threeIndexSlice, 101)
	console.log($.len(threeIndexSlice)) // 4
	console.log($.cap(threeIndexSlice)) // 6 (or more)
	console.log(threeIndexSlice![3]) // 101
	console.log(threeIndexArr![4]) // 4 (original NOT modified by reallocating append)

	// --- Additional Tests for Full Coverage ---
	console.log("--- Additional Tests ---")

	// Slice literal
	let sliceLiteral = $.arrayToSlice<number>([10, 20, 30])
	console.log("Slice literal len:", $.len(sliceLiteral)) // 3
	console.log("Slice literal cap:", $.cap(sliceLiteral)) // 3
	console.log("Slice literal[1]:", sliceLiteral![1]) // 20

	// Nil slice
	let nilSlice: $.Slice<number> = null
	console.log("Nil slice len:", $.len(nilSlice)) // 0
	console.log("Nil slice cap:", $.cap(nilSlice)) // 0
	nilSlice = $.append(nilSlice, 5)
	console.log("Append to nil slice len:", $.len(nilSlice)) // 1
	console.log("Append to nil slice cap:", $.cap(nilSlice)) // 1 (or more)
	console.log("Append to nil slice[0]:", nilSlice![0]) // 5

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
	console.log("--- Slices of Slices Tests ---")

	// Create a slice of slices of integers
	let sliceOfSlices = $.arrayToSlice<$.Slice<number>>([[ 1, 2, 3 ], [ 4, 5 ], [ 6, 7, 8, 9 ]], 2)

	console.log("Length of sliceOfSlices:", $.len(sliceOfSlices)) // 3
	console.log("Capacity of sliceOfSlices:", $.cap(sliceOfSlices)) // 3

	// Access elements
	console.log("sliceOfSlices[0][1]:", sliceOfSlices![0]![1]) // 2
	console.log("sliceOfSlices[1][0]:", sliceOfSlices![1]![0]) // 4
	console.log("sliceOfSlices[2][3]:", sliceOfSlices![2]![3]) // 9

	// Append to inner slice (should modify the inner slice)
	console.log("--- Append to inner slice ---")
	let innerSlice = sliceOfSlices![1]
	console.log("Length of innerSlice:", $.len(innerSlice)) // 2
	console.log("Capacity of innerSlice:", $.cap(innerSlice)) // 2

	innerSlice = $.append(innerSlice, 50)
	console.log("Length of innerSlice after append:", $.len(innerSlice)) // 3
	console.log("Capacity of innerSlice after append:", $.cap(innerSlice)) // 4 (or more)
	console.log("innerSlice[2]:", innerSlice![2]) // 50

	// Check if the original slice of slices reflects the change (it should, as innerSlice is a view)
	// Note: Appending to innerSlice might reallocate its underlying array if capacity is exceeded.
	// If reallocated, the original sliceOfSlices will *not* see the change at that index.
	// This test case specifically checks the scenario where the append happens within the original capacity
	// or if the reallocation behavior is correctly handled by GoScript.
	// For this simple case, appending 50 to {4, 5} will likely cause reallocation.
	// Let's test appending within capacity first.

	// Create a slice of slices where inner slice has capacity for append

	// {0, 0}, len 2, cap 5
	let sliceOfSlicesWithCap = $.arrayToSlice<$.Slice<number>>([[ 1, 2, 3 ], $.makeSlice<number>(2, 5), [ 6, 7, 8, 9 ]], 2)
	sliceOfSlicesWithCap![1]![0] = 40
	sliceOfSlicesWithCap![1]![1] = 50

	console.log("--- Append to inner slice with capacity ---")
	let innerSliceWithCap = sliceOfSlicesWithCap![1]
	console.log("Length of innerSliceWithCap:", $.len(innerSliceWithCap)) // 2
	console.log("Capacity of innerSliceWithCap:", $.cap(innerSliceWithCap)) // 5

	innerSliceWithCap = $.append(innerSliceWithCap, 60)
	console.log("Length of innerSliceWithCap after append:", $.len(innerSliceWithCap)) // 3
	console.log("Capacity of innerSliceWithCap after append:", $.cap(innerSliceWithCap)) // 5
	console.log("innerSliceWithCap[2]:", innerSliceWithCap![2]) // 60

	// Check if the original slice of slices reflects the change (it should, as append was within capacity)
	console.log("sliceOfSlicesWithCap[1][2]:", $.goSlice(sliceOfSlicesWithCap![1], undefined, 3)![2]) // 60

	// Append to inner slice exceeding capacity
	console.log("--- Append to inner slice exceeding capacity ---")
	let innerSliceExceedCap = sliceOfSlices![0]
	console.log("Length of innerSliceExceedCap:", $.len(innerSliceExceedCap)) // 3
	console.log("Capacity of innerSliceExceedCap:", $.cap(innerSliceExceedCap)) // 3

	innerSliceExceedCap = $.append(innerSliceExceedCap, 10, 20)
	console.log("Length of innerSliceExceedCap after append:", $.len(innerSliceExceedCap)) // 5
	console.log("Capacity of innerSliceExceedCap after append:", $.cap(innerSliceExceedCap)) // 6 (or more)
	console.log("innerSliceExceedCap[3]:", innerSliceExceedCap![3]) // 10
	console.log("innerSliceExceedCap[4]:", innerSliceExceedCap![4]) // 20

	// Check if the original slice of slices reflects the change (it should NOT, due to reallocation)
	// The original sliceOfSlices[0] should still be {1, 2, 3}
	console.log("Original sliceOfSlices[0] after inner append:", sliceOfSlices![0]![0], sliceOfSlices![0]![1], sliceOfSlices![0]![2]) // 1 2 3

	// Slicing a slice of slices
	console.log("--- Slicing a slice of slices ---")
	let subSliceOfSlices = $.goSlice(sliceOfSlices, 1, 3)
	console.log("Length of subSliceOfSlices:", $.len(subSliceOfSlices)) // 2
	console.log("Capacity of subSliceOfSlices:", $.cap(subSliceOfSlices)) // 2
	console.log("subSliceOfSlices[0][0]:", subSliceOfSlices![0]![0]) // 4
	console.log("subSliceOfSlices[1][2]:", subSliceOfSlices![1]![2]) // 8

	// Modify element in sub-slice of slices (should affect original)
	console.log("--- Modify element in sub-slice of slices ---")
	subSliceOfSlices![0]![1] = 55
	console.log("sliceOfSlices[1][1] after sub-slice modification:", sliceOfSlices![1]![1]) // 55

	// Append a new slice to the slice of slices
	console.log("--- Append a new slice to slice of slices ---")
	sliceOfSlices = $.append(sliceOfSlices, $.arrayToSlice<number>([100, 110]))
	console.log("Length of sliceOfSlices after append:", $.len(sliceOfSlices)) // 4
	console.log("Capacity of sliceOfSlices after append:", $.cap(sliceOfSlices)) // 6 (or more)
	console.log("sliceOfSlices[3][0]:", sliceOfSlices![3]![0]) // 100

	// Append an existing slice to the slice of slices
	console.log("--- Append an existing slice to slice of slices ---")
	let existingSlice = $.arrayToSlice<number>([200, 210])
	sliceOfSlices = $.append(sliceOfSlices, existingSlice)
	console.log("Length of sliceOfSlices after appending existing:", $.len(sliceOfSlices)) // 5
	console.log("Capacity of sliceOfSlices after appending existing:", $.cap(sliceOfSlices)) // 6 (or more)
	console.log("sliceOfSlices[4][1]:", sliceOfSlices![4]![1]) // 210

	// Modify the appended existing slice (should NOT affect the slice in sliceOfSlices if it was copied)
	// Go's append copies the slice header, but the underlying array is shared unless reallocation occurs.
	// Modifying existingSlice *after* appending it should not affect the copy in sliceOfSlices
	// unless they still share the underlying array and the modification is within the shared capacity.
	// Let's test this carefully.
	console.log("--- Modify appended existing slice ---")
	existingSlice![0] = 205
	console.log("sliceOfSlices[4][0] after modifying existingSlice:", sliceOfSlices![4]![0]) // Should still be 200 if copied or shared but not modified at index 0

	// If we modify an element in the slice within sliceOfSlices, it *should* affect the original existingSlice
	// if they share the underlying array.
	console.log("--- Modify slice within sliceOfSlices ---")
	sliceOfSlices![4]![1] = 215
	console.log("existingSlice[1] after modifying slice within sliceOfSlices:", existingSlice![1]) // Should be 215

	// Create a slice of slices using make
	console.log("--- Make slice of slices ---")
	let makeSliceOfSlices = $.makeSlice<$.Slice<number>>(2, 4)
	console.log("Length of makeSliceOfSlices:", $.len(makeSliceOfSlices)) // 2
	console.log("Capacity of makeSliceOfSlices:", $.cap(makeSliceOfSlices)) // 4

	// Initialize inner slices
	makeSliceOfSlices![0] = $.arrayToSlice<number>([1000, 2000])
	makeSliceOfSlices![1] = $.makeSlice<number>(1, 3)
	makeSliceOfSlices![1]![0] = 3000

	console.log("makeSliceOfSlices[0][1]:", makeSliceOfSlices![0]![1]) // 2000
	console.log("makeSliceOfSlices[1][0]:", makeSliceOfSlices![1]![0]) // 3000

	// Append a new inner slice
	makeSliceOfSlices = $.append(makeSliceOfSlices, $.arrayToSlice<number>([4000, 5000]))
	console.log("Length of makeSliceOfSlices after append:", $.len(makeSliceOfSlices)) // 3
	console.log("Capacity of makeSliceOfSlices after append:", $.cap(makeSliceOfSlices)) // 4
	console.log("makeSliceOfSlices[2][1]:", makeSliceOfSlices![2]![1]) // 5000

	// Append another new inner slice (should exceed capacity and reallocate outer slice)
	makeSliceOfSlices = $.append(makeSliceOfSlices, $.arrayToSlice<number>([6000]))
	console.log("Length of makeSliceOfSlices after second append:", $.len(makeSliceOfSlices)) // 4
	console.log("Capacity of makeSliceOfSlices after second append:", $.cap(makeSliceOfSlices)) // 8 (or more)
	console.log("makeSliceOfSlices[3][0]:", makeSliceOfSlices![3]![0]) // 6000

	// Nil slice of slices
	console.log("--- Nil slice of slices ---")
	let nilSliceOfSlices: $.Slice<$.Slice<number>> = null
	console.log("Nil slice of slices len:", $.len(nilSliceOfSlices)) // 0
	console.log("Nil slice of slices cap:", $.cap(nilSliceOfSlices)) // 0

	// Append to nil slice of slices
	nilSliceOfSlices = $.append(nilSliceOfSlices, $.arrayToSlice<number>([10000]))
	console.log("Length of nilSliceOfSlices after append:", $.len(nilSliceOfSlices)) // 1
	console.log("Capacity of nilSliceOfSlices after append:", $.cap(nilSliceOfSlices)) // 1 (or more)
	console.log("nilSliceOfSlices[0][0]:", nilSliceOfSlices![0]![0]) // 10000

	// Append another slice to the nil slice of slices
	nilSliceOfSlices = $.append(nilSliceOfSlices, $.arrayToSlice<number>([20000, 30000]))
	console.log("Length of nilSliceOfSlices after second append:", $.len(nilSliceOfSlices)) // 2
	console.log("Capacity of nilSliceOfSlices after second append:", $.cap(nilSliceOfSlices)) // 2 (or more)
	console.log("nilSliceOfSlices[1][1]:", nilSliceOfSlices![1]![1]) // 30000

	// Empty slice of slices (not nil)
	console.log("--- Empty slice of slices ---")
	let emptySliceOfSlices = $.makeSlice<$.Slice<number>>(0)
	console.log("Empty slice of slices len:", $.len(emptySliceOfSlices)) // 0
	console.log("Empty slice of slices cap:", $.cap(emptySliceOfSlices)) // 0 (or more, implementation dependent)

	// Append to empty slice of slices
	emptySliceOfSlices = $.append(emptySliceOfSlices, $.arrayToSlice<number>([40000]))
	console.log("Length of emptySliceOfSlices after append:", $.len(emptySliceOfSlices)) // 1
	console.log("Capacity of emptySliceOfSlices after append:", $.cap(emptySliceOfSlices)) // 1 (or more)
	console.log("emptySliceOfSlices[0][0]:", emptySliceOfSlices![0]![0]) // 40000
}

