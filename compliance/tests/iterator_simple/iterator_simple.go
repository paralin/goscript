package main

func simpleIterator(yield func(int) bool) {
	for i := 0; i < 3; i++ {
		if !yield(i) {
			return
		}
	}
}

func keyValueIterator(yield func(int, string) bool) {
	values := []string{"a", "b", "c"}
	for i, v := range values {
		if !yield(i, v) {
			return
		}
	}
}

func main() {
	println("Testing single value iterator:")
	for v := range simpleIterator {
		println("value:", v)
	}

	println("Testing key-value iterator:")
	for k, v := range keyValueIterator {
		println("key:", k, "value:", v)
	}

	println("test finished")
}
