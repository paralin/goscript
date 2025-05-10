package main

func main() {
	nums := []int{2, 3, 4}
	sum := 0
	for _, num := range nums {
		sum += num
	}
	println("sum:", sum)

	for i, num := range nums {
		println("index:", i, "value:", num)
	}

	// Test ranging over an array
	arr := [3]string{"a", "b", "c"}
	for i, s := range arr {
		println("index:", i, "value:", s)
	}

	// Test ranging over a string
	str := "go"
	for i, c := range str {
		println("index:", i, "value:", c) // Note: c will be a rune (int32)
	}

	// Test ranging over a slice without key or value
	println("Ranging over slice (no key/value):")
	for range nums {
		println("Iterating slice")
	}

	// Test ranging over an array without key or value
	println("Ranging over array (no key/value):")
	for range arr {
		println("Iterating array")
	}

	// Test ranging over a string without key or value
	println("Ranging over string (no key/value):")
	for range str {
		println("Iterating string")
	}
}
