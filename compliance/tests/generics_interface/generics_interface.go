package main

// Generic interface with type parameter
type Container[T any] interface {
	Get() T
	Set(T)
	Size() int
}

// Generic interface with constraint
type Comparable[T comparable] interface {
	Compare(T) int
	Equal(T) bool
}

// Simple struct implementing generic interface
type Box[T any] struct {
	value T
	count int
}

func (b *Box[T]) Get() T {
	return b.value
}

func (b *Box[T]) Set(v T) {
	b.value = v
	b.count++
}

func (b *Box[T]) Size() int {
	return b.count
}

// String struct implementing comparable interface
type StringBox struct {
	value string
}

func (s *StringBox) Compare(other string) int {
	if s.value < other {
		return -1
	} else if s.value > other {
		return 1
	}
	return 0
}

func (s *StringBox) Equal(other string) bool {
	return s.value == other
}

// Function that works with generic interface
func useContainer[T any](c Container[T], val T) T {
	c.Set(val)
	return c.Get()
}

// Function that works with comparable interface
func checkEqual[T comparable](c Comparable[T], val T) bool {
	return c.Equal(val)
}

func main() {
	println("=== Generic Interface Test ===")

	// Test Box implementing Container
	intBox := &Box[int]{}
	result := useContainer(intBox, 42)
	println("Int box result:", result)
	println("Int box size:", intBox.Size())

	stringBox := &Box[string]{}
	strResult := useContainer(stringBox, "hello")
	println("String box result:", strResult)
	println("String box size:", stringBox.Size())

	// Test StringBox implementing Comparable
	sb := &StringBox{value: "test"}
	println("String comparison equal:", checkEqual(sb, "test"))
	println("String comparison not equal:", checkEqual(sb, "other"))
	println("String comparison -1:", sb.Compare("zebra"))
	println("String comparison 1:", sb.Compare("alpha"))
	println("String comparison 0:", sb.Compare("test"))
}
