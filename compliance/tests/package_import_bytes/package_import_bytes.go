package main

import "bytes"

func main() {
	// Test basic byte slice operations
	b1 := []byte("hello")
	b2 := []byte("world")

	// Test Equal
	if bytes.Equal(b1, b1) {
		println("Equal works correctly")
	}

	// Test Compare
	result := bytes.Compare(b1, b2)
	if result < 0 {
		println("Compare works: hello < world")
	}

	// Test Contains
	if bytes.Contains(b1, []byte("ell")) {
		println("Contains works correctly")
	}

	// Test Index
	idx := bytes.Index(b1, []byte("ll"))
	if idx == 2 {
		println("Index works correctly, found at position:", idx)
	}

	// Test Join
	slices := [][]byte{b1, b2}
	joined := bytes.Join(slices, []byte(" "))
	println("Joined:", string(joined))

	// Test Split
	split := bytes.Split(joined, []byte(" "))
	println("Split result length:", len(split))
	if len(split) == 2 {
		println("Split works correctly")
	}

	// Test HasPrefix and HasSuffix
	if bytes.HasPrefix(b1, []byte("he")) {
		println("HasPrefix works correctly")
	}

	if bytes.HasSuffix(b1, []byte("lo")) {
		println("HasSuffix works correctly")
	}

	// Test Trim functions
	whitespace := []byte("  hello  ")
	trimmed := bytes.TrimSpace(whitespace)
	println("Trimmed:", string(trimmed))

	// Test ToUpper and ToLower
	upper := bytes.ToUpper(b1)
	lower := bytes.ToLower(upper)
	println("Upper:", string(upper))
	println("Lower:", string(lower))

	// Test Repeat
	repeated := bytes.Repeat([]byte("x"), 3)
	println("Repeated:", string(repeated))

	// Test Count
	count := bytes.Count([]byte("banana"), []byte("a"))
	println("Count of 'a' in 'banana':", count)

	// Test Replace
	replaced := bytes.Replace([]byte("hello hello"), []byte("hello"), []byte("hi"), 1)
	println("Replace result:", string(replaced))

	// Test ReplaceAll
	replacedAll := bytes.ReplaceAll([]byte("hello hello"), []byte("hello"), []byte("hi"))
	println("ReplaceAll result:", string(replacedAll))

	// Test Buffer
	var buf bytes.Buffer
	buf.WriteString("Hello ")
	buf.WriteString("World")
	println("Buffer content:", buf.String())
	println("Buffer length:", buf.Len())

	// Test Buffer Read
	data := make([]byte, 5)
	n, _ := buf.Read(data)
	println("Read", n, "bytes:", string(data))

	// Test Buffer Reset
	buf.Reset()
	println("Buffer after reset, length:", buf.Len())

	println("test finished")
}
