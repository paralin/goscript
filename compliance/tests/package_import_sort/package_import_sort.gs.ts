// Generated file based on package_import_sort.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as sort from "@goscript/sort/index.js"

export async function main(): Promise<void> {
	// Test basic slice sorting
	let ints = $.arrayToSlice<number>([3, 1, 4, 1, 5, 9])
	console.log("Original ints:", ints![0], ints![1], ints![2], ints![3], ints![4], ints![5])
	sort.Ints(ints)
	console.log("Sorted ints:", ints![0], ints![1], ints![2], ints![3], ints![4], ints![5])

	// Test if sorted
	let isSorted = sort.IntsAreSorted(ints)
	console.log("Ints are sorted:", isSorted)

	// Test string sorting
	let strings = $.arrayToSlice<string>(["banana", "apple", "cherry"])
	console.log("Original strings:", strings![0], strings![1], strings![2])
	sort.Strings(strings)
	console.log("Sorted strings:", strings![0], strings![1], strings![2])

	// Test if strings are sorted
	let stringSorted = sort.StringsAreSorted(strings)
	console.log("Strings are sorted:", stringSorted)

	// Test float64 sorting
	let floats = $.arrayToSlice<number>([3.14, 2.71, 1.41])
	console.log("Original floats:", floats![0], floats![1], floats![2])
	sort.Float64s(floats)
	console.log("Sorted floats:", floats![0], floats![1], floats![2])

	// Test if floats are sorted
	let floatSorted = sort.Float64sAreSorted(floats)
	console.log("Floats are sorted:", floatSorted)

	// Test search functions
	let intIndex = sort.SearchInts(ints, 4)
	console.log("Index of 4 in sorted ints:", intIndex)

	let stringIndex = sort.SearchStrings(strings, "banana")
	console.log("Index of 'banana' in sorted strings:", stringIndex)

	let floatIndex = sort.SearchFloat64s(floats, 2.71)
	console.log("Index of 2.71 in sorted floats:", floatIndex)

	// Test generic Search function
	let searchResult = sort.Search($.len(ints), (i: number): boolean => {
		return ints![i] >= 5
	})
	console.log("First index where value >= 5:", searchResult)

	// Test Slice function with custom comparator
	let testSlice = $.arrayToSlice<number>([5, 2, 8, 1, 9])
	sort.Slice(testSlice, (i: number, j: number): boolean => {
		return testSlice![i] < testSlice![j]
	})
	console.log("Custom sorted slice:", testSlice![0], testSlice![1], testSlice![2], testSlice![3], testSlice![4])

	// Test SliceIsSorted
	let isSliceSorted = sort.SliceIsSorted(testSlice, (i: number, j: number): boolean => {
		return testSlice![i] < testSlice![j]
	})
	console.log("Custom slice is sorted:", isSliceSorted)

	console.log("test finished")
}

