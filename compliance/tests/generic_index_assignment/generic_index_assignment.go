package main

// Test case for generic index assignment issue
// This reproduces the "Invalid assignment target" error where
// s[i] = v generates $.indexStringOrBytes(s, i) = v in TypeScript

func modifyGenericSlice[S ~[]E, E any](s S, i int, v E) {
	// This line causes the issue: s[i] = v
	// For generic slice types, the compiler should generate proper assignment
	// But currently it may generate: $.indexStringOrBytes(s, i) = v
	// which is invalid TypeScript syntax
	s[i] = v
}

func main() {
	slice := []int{1, 2, 3}
	modifyGenericSlice(slice, 1, 42)

	println("slice[0]:", slice[0])
	println("slice[1]:", slice[1])
	println("slice[2]:", slice[2])
	println("test finished")
}
