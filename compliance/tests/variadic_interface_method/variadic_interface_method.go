package main

type Basic interface {
	Join(elem ...string) string
}

type PathJoiner struct{}

func (p PathJoiner) Join(elem ...string) string {
	result := ""
	for i, e := range elem {
		if i > 0 {
			result += "/"
		}
		result += e
	}
	return result
}

func main() {
	var b Basic = PathJoiner{}

	// Test with multiple arguments
	result1 := b.Join("path", "to", "file")
	println("Result1:", result1)

	// Test with single argument
	result2 := b.Join("single")
	println("Result2:", result2)

	// Test with no arguments
	result3 := b.Join()
	println("Result3:", result3)

	// Test with slice expansion
	parts := []string{"another", "path", "here"}
	result4 := b.Join(parts...)
	println("Result4:", result4)
}
