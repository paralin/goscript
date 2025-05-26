package main

// This test reproduces the "unhandled make call" error
// when using make() with generic types like set.Ints[int64]

// Simulate the set.Ints generic type from gonum
type Ints[T comparable] map[T]struct{}

func main() {
	// This should trigger the unhandled make call error
	// Similar to: seen := make(set.Ints[int64])
	seen := make(Ints[int64])

	// Test basic operations
	seen[42] = struct{}{}
	_, exists := seen[42]
	println("Value exists:", exists)

	// Test with string type parameter
	stringSet := make(Ints[string])
	stringSet["hello"] = struct{}{}
	_, exists2 := stringSet["hello"]
	println("String exists:", exists2)
}
