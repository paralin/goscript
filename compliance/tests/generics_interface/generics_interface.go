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
type ValueContainer[T any] struct {
	value T
	count int
}

func (b *ValueContainer[T]) Get() T {
	return b.value
}

func (b *ValueContainer[T]) Set(v T) {
	b.value = v
	b.count++
}

func (b *ValueContainer[T]) Size() int {
	return b.count
}

// String struct implementing comparable interface
type StringValueContainer struct {
	value string
}

func (s *StringValueContainer) Compare(other string) int {
	if s.value < other {
		return -1
	} else if s.value > other {
		return 1
	}
	return 0
}

func (s *StringValueContainer) Equal(other string) bool {
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

	// Test ValueContainer implementing Container
	intValueContainer := &ValueContainer[int]{}
	result := useContainer(intValueContainer, 42)
	println("Int ValueContainer result:", result)
	println("Int ValueContainer size:", intValueContainer.Size())

	stringValueContainer := &ValueContainer[string]{}
	strResult := useContainer(stringValueContainer, "hello")
	println("String ValueContainer result:", strResult)
	println("String ValueContainer size:", stringValueContainer.Size())

	// Test StringValueContainer implementing Comparable
	sb := &StringValueContainer{value: "test"}
	println("String comparison equal:", checkEqual(sb, "test"))
	println("String comparison not equal:", checkEqual(sb, "other"))
	println("String comparison -1:", sb.Compare("zebra"))
	println("String comparison 1:", sb.Compare("alpha"))
	println("String comparison 0:", sb.Compare("test"))
}
