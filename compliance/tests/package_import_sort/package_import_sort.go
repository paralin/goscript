package main

import "sort"

func main() {
	// Test basic slice sorting
	ints := []int{3, 1, 4, 1, 5, 9}
	println("Original ints:", ints[0], ints[1], ints[2], ints[3], ints[4], ints[5])
	sort.Ints(ints)
	println("Sorted ints:", ints[0], ints[1], ints[2], ints[3], ints[4], ints[5])

	// Test if sorted
	isSorted := sort.IntsAreSorted(ints)
	println("Ints are sorted:", isSorted)

	// Test string sorting
	strings := []string{"banana", "apple", "cherry"}
	println("Original strings:", strings[0], strings[1], strings[2])
	sort.Strings(strings)
	println("Sorted strings:", strings[0], strings[1], strings[2])

	// Test if strings are sorted
	stringSorted := sort.StringsAreSorted(strings)
	println("Strings are sorted:", stringSorted)

	// Test float64 sorting
	floats := []float64{3.14, 2.71, 1.41}
	println("Original floats:", floats[0], floats[1], floats[2])
	sort.Float64s(floats)
	println("Sorted floats:", floats[0], floats[1], floats[2])

	// Test if floats are sorted
	floatSorted := sort.Float64sAreSorted(floats)
	println("Floats are sorted:", floatSorted)

	// Test search functions
	intIndex := sort.SearchInts(ints, 4)
	println("Index of 4 in sorted ints:", intIndex)

	stringIndex := sort.SearchStrings(strings, "banana")
	println("Index of 'banana' in sorted strings:", stringIndex)

	floatIndex := sort.SearchFloat64s(floats, 2.71)
	println("Index of 2.71 in sorted floats:", floatIndex)

	// Test generic Search function
	searchResult := sort.Search(len(ints), func(i int) bool {
		return ints[i] >= 5
	})
	println("First index where value >= 5:", searchResult)

	// Test Slice function with custom comparator
	testSlice := []int{5, 2, 8, 1, 9}
	sort.Slice(testSlice, func(i, j int) bool {
		return testSlice[i] < testSlice[j]
	})
	println("Custom sorted slice:", testSlice[0], testSlice[1], testSlice[2], testSlice[3], testSlice[4])

	// Test SliceIsSorted
	isSliceSorted := sort.SliceIsSorted(testSlice, func(i, j int) bool {
		return testSlice[i] < testSlice[j]
	})
	println("Custom slice is sorted:", isSliceSorted)

	println("test finished")
}
