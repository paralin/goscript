package main

func main() {
	s := []int{10, 20, 30}
	sum := 0
	for _, v := range s {
		sum += v
		println(v)
	}
	println(sum)

	arr := [3]string{"a", "b", "c"}
	concat := ""
	for _, val := range arr {
		concat += val
		println(val)
	}
	println(concat)

	// Test with blank identifier for value (should still iterate)
	println("Ranging with blank identifier for value:")
	count := 0
	for _, _ = range s { // Both key and value are blank identifiers
		count++
	}
	println(count) // Should be 3
}
