package main

// Generic function with any constraint
func printVal[T any](val T) {
	println(val)
}

// Generic function with comparable constraint
func equal[T comparable](a, b T) bool {
	return a == b
}

// Generic function with union constraint
func getLength[S string | []byte](s S) int {
	return len(s)
}

// Generic struct
type Pair[T any] struct {
	First  T
	Second T
}

func (p Pair[T]) GetFirst() T {
	return p.First
}

// Generic function returning a generic struct
func makePair[T any](a, b T) Pair[T] {
	return Pair[T]{First: a, Second: b}
}

// Generic slice operations
func append2[T any](slice []T, elem T) []T {
	return append(slice, elem)
}

func main() {
	// Test basic generic function
	println("=== Basic Generic Function ===")
	printVal(42)
	printVal("hello")
	printVal(true)

	// Test comparable constraint
	println("=== Comparable Constraint ===")
	println(equal(1, 1))
	println(equal(1, 2))
	println(equal("hello", "hello"))
	println(equal("hello", "world"))

	// Test union constraint with string
	println("=== Union Constraint ===")
	str := "hello"
	println(getLength(str))

	// Test union constraint with []byte
	bytes := []byte("world")
	println(getLength(bytes))

	// Test generic struct
	println("=== Generic Struct ===")
	intPair := makePair(10, 20)
	println(intPair.GetFirst())
	println(intPair.First)
	println(intPair.Second)

	stringPair := makePair("foo", "bar")
	println(stringPair.GetFirst())
	println(stringPair.First)
	println(stringPair.Second)

	// Test generic slice operations
	println("=== Generic Slice Operations ===")
	nums := []int{1, 2, 3}
	nums = append2(nums, 4)
	for _, n := range nums {
		println(n)
	}

	words := []string{"a", "b"}
	words = append2(words, "c")
	for _, w := range words {
		println(w)
	}

	// Test type inference
	println("=== Type Inference ===")
	result := makePair(100, 200)
	println(result.First)
	println(result.Second)
}
