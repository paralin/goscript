package main

func main() {
	// Test simple keyed array literal with integer keys
	arr1 := [5]string{
		1: "first",
		3: "third",
	}
	println("arr1[0]:", arr1[0])
	println("arr1[1]:", arr1[1])
	println("arr1[2]:", arr1[2])
	println("arr1[3]:", arr1[3])
	println("arr1[4]:", arr1[4])

	// Test keyed array literal with expression keys (this likely causes the issue)
	const offset = 10
	arr2 := [15]string{
		offset + 1: "at index 11",
		offset + 3: "at index 13",
	}
	println("arr2[10]:", arr2[10])
	println("arr2[11]:", arr2[11])
	println("arr2[12]:", arr2[12])
	println("arr2[13]:", arr2[13])
	println("arr2[14]:", arr2[14])

	// Test mixed keyed and unkeyed elements
	arr3 := [8]int{
		1, 2, // unkeyed (indices 0, 1)
		5:   100, // keyed (index 5)
		200, // unkeyed (index 6)
	}
	println("arr3[0]:", arr3[0])
	println("arr3[1]:", arr3[1])
	println("arr3[2]:", arr3[2])
	println("arr3[5]:", arr3[5])
	println("arr3[6]:", arr3[6])
	println("arr3[7]:", arr3[7])

	// Test slice with keyed elements
	slice1 := []string{
		2: "second",
		4: "fourth",
	}
	println("slice1[0]:", slice1[0])
	println("slice1[1]:", slice1[1])
	println("slice1[2]:", slice1[2])
	println("slice1[3]:", slice1[3])
	println("slice1[4]:", slice1[4])

	println("keyed array literal test completed")
}
