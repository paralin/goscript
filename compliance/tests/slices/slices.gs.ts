// Generated file based on slices.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	// --- Original Tests ---
	console.log("--- Original Tests ---")
	// Create a slice of integers with length 5 and capacity 10
	let s = goscript.makeSlice(5, 10)
	console.log(goscript.len(s)) // 5
	console.log(goscript.cap(s)) // 10
	
	// Create a slice of strings with length 3
	let s2 = goscript.makeSlice(3)
	console.log(goscript.len(s2)) // 3
	console.log(goscript.cap(s2)) // 3
	
	// Assign values
	s[0] = 10
	s[4] = 20
	s2[1] = "hello"
	
	console.log(s[0]) // 10
	console.log(s[4]) // 20
	console.log(s2[1]) // hello
	
	// --- New Tests ---
	console.log("--- New Tests ---")
	
	// Create slice from array literal
	let arrLit = [1, 2, 3, 4, 5]
	let sliceFromLit = goscript.slice(arrLit, undefined, undefined)
	console.log(goscript.len(sliceFromLit)) // 5
	console.log(goscript.cap(sliceFromLit)) // 5
	console.log(sliceFromLit[0]) // 1
	console.log(sliceFromLit[4]) // 5
	
	// Create slice from array variable
	let arrVar = ["a", "b", "c", "d"]
	let sliceFromVar = goscript.slice(arrVar, undefined, undefined)
	console.log(goscript.len(sliceFromVar)) // 4
	console.log(goscript.cap(sliceFromVar)) // 4
	console.log(sliceFromVar[0]) // a
	console.log(sliceFromVar[3]) // d
	
	// Create slice with specific indices
	let sliceIndices = goscript.slice(arrVar, 1, 3) // ["b", "c"]
	console.log(goscript.len(sliceIndices)) // 2
	console.log(goscript.cap(sliceIndices)) // 3 (cap is from start index to end of original array)
	console.log(sliceIndices[0]) // b
	console.log(sliceIndices[1]) // c
	
	// Create slice with 0 len/cap and append
	console.log("--- Zero len/cap append ---")
	let zeroSlice = goscript.makeSlice(0, 0)
	console.log(goscript.len(zeroSlice)) // 0
	console.log(goscript.cap(zeroSlice)) // 0
	zeroSlice = goscript.append(zeroSlice, 100)
	console.log(goscript.len(zeroSlice)) // 1
	console.log(goscript.cap(zeroSlice)) // 1 (or more, implementation dependent)
	console.log(zeroSlice[0]) // 100
	zeroSlice = goscript.append(zeroSlice, 200)
	console.log(goscript.len(zeroSlice)) // 2
	console.log(goscript.cap(zeroSlice)) // 2 (or more)
	console.log(zeroSlice[1]) // 200
	
	// Modify slice, check original array
	console.log("--- Modify slice, check array ---")
	let modArr = [10, 20, 30]
	let modSlice = goscript.slice(modArr, undefined, undefined)
	modSlice[1] = 25 // Modify slice
	console.log(modArr[1]) // 25 (original array should be modified)
	console.log(modSlice[1]) // 25
	
	// Modify array, check slice
	console.log("--- Modify array, check slice ---")
	modArr[0] = 15 // Modify array
	console.log(modArr[0]) // 15
	console.log(modSlice[0]) // 15 (slice should reflect change)
	
	// Append to sub-slice within capacity
	console.log("--- Append sub-slice w/in capacity ---")
	let appendArr = [1, 2, 3, 4, 5]
	let appendSlice1 = goscript.slice(appendArr, 0, 2) // len 2, cap 5; [1, 2]
	console.log(goscript.len(appendSlice1)) // 2
	console.log(goscript.cap(appendSlice1)) // 5
	let appendSlice2 = goscript.append(appendSlice1, 99) // Appends within original capacity
	console.log(goscript.len(appendSlice2)) // 3
	console.log(goscript.cap(appendSlice2)) // 5
	console.log(appendSlice2[2]) // 99
	console.log(appendArr[2]) // 99 (original array modified)
	
	// Append to sub-slice exceeding capacity
	console.log("--- Append sub-slice exceed capacity ---")
	let appendSlice3 = goscript.slice(appendArr, 3, 5) // len 2, cap 2; [4, 5]
	console.log(goscript.len(appendSlice3)) // 2
	console.log(goscript.cap(appendSlice3)) // 2
	let appendSlice4 = goscript.append(appendSlice3, 101) // Appends beyond original capacity
	console.log(goscript.len(appendSlice4)) // 3
	console.log(goscript.cap(appendSlice4)) // 4 (or more, new underlying array)
	console.log(appendSlice4[0]) // 4
	console.log(appendSlice4[1]) // 5
	console.log(appendSlice4[2]) // 101
	// Original array should NOT be modified beyond its bounds by this append
	console.log(appendArr[0]) // 1
	console.log(appendArr[1]) // 2
	console.log(appendArr[2]) // 99 (from previous append)
	console.log(appendArr[3]) // 4
	console.log(appendArr[4]) // 5
	
	// Slicing a slice
	console.log("--- Slicing a slice ---")
	let baseSlice = [0, 10, 20, 30, 40, 50]
	let subSlice1 = goscript.slice(baseSlice, 1, 4) // [10, 20, 30], len 3, cap 5
	console.log(goscript.len(subSlice1)) // 3
	console.log(goscript.cap(subSlice1)) // 5
	console.log(subSlice1[0]) // 10
	let subSlice2 = goscript.slice(subSlice1, 1, 3) // [20, 30], len 2, cap 4 (cap from subSlice1's start)
	console.log(goscript.len(subSlice2)) // 2
	console.log(goscript.cap(subSlice2)) // 4
	console.log(subSlice2[0]) // 20
	console.log(subSlice2[1]) // 30
	subSlice2[0] = 22 // Modify sub-sub-slice
	console.log(subSlice1[1]) // 22 (subSlice1 modified)
	console.log(baseSlice[2]) // 22 (baseSlice modified)
	
	// Three-index slicing (if supported) - Check capacity
	console.log("--- Three-index slicing ---")
	let threeIndexArr = [0, 1, 2, 3, 4, 5]
	let threeIndexSlice = goscript.slice(threeIndexArr, 1, 3, 4) // [1, 2], len 2, cap 3 (4-1)
	console.log(goscript.len(threeIndexSlice)) // 2
	console.log(goscript.cap(threeIndexSlice)) // 3
	console.log(threeIndexSlice[0]) // 1
	console.log(threeIndexSlice[1]) // 2
	// Appending should modify original array up to new capacity limit
	threeIndexSlice = goscript.append(threeIndexSlice, 99)
	console.log(goscript.len(threeIndexSlice)) // 3
	console.log(goscript.cap(threeIndexSlice)) // 3
	console.log(threeIndexSlice[2]) // 99
	console.log(threeIndexArr[3]) // 99 (original modified)
	// Appending again should reallocate
	threeIndexSlice = goscript.append(threeIndexSlice, 101)
	console.log(goscript.len(threeIndexSlice)) // 4
	console.log(goscript.cap(threeIndexSlice)) // 6 (or more)
	console.log(threeIndexSlice[3]) // 101
	console.log(threeIndexArr[4]) // 4 (original NOT modified by reallocating append)
	
	// --- Additional Tests for Full Coverage ---
	console.log("--- Additional Tests ---")
	
	// Slice literal
	let sliceLiteral = [10, 20, 30]
	console.log("Slice literal len:", goscript.len(sliceLiteral)) // 3
	console.log("Slice literal cap:", goscript.cap(sliceLiteral)) // 3
	console.log("Slice literal[1]:", sliceLiteral[1]) // 20
	
	// Nil slice
	let nilSlice: number[] = [];
	console.log("Nil slice len:", goscript.len(nilSlice)) // 0
	console.log("Nil slice cap:", goscript.cap(nilSlice)) // 0
	nilSlice = goscript.append(nilSlice, 5)
	console.log("Append to nil slice len:", goscript.len(nilSlice)) // 1
	console.log("Append to nil slice cap:", goscript.cap(nilSlice)) // 1 (or more)
	
	// Out-of-bounds indexing (should panic)
	// Note: Testing panics in compliance tests requires specific handling in the test runner.
	// For now, we'll add the code but expect it to fail if panics are not caught.
	// The runner should ideally catch these panics and verify the error type/message.
	
	// println("--- Testing out-of-bounds panic ---")
	// smallSlice := []int{1}
	// println(smallSlice[1]) // Index out of bounds (len 1, cap 1) - should panic
	// smallSlice[1] = 10     // Index out of bounds - should panic
	// println(smallSlice[-1]) // Negative index - should panic
	console.log("Append to nil slice[0]:", nilSlice[0]) // 5
	
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

