package main

func main() {
	myStr1 := "testing"
	println("myStr1:", myStr1)
	println("len(myStr1):", len(myStr1))

	// Basic slicing
	println("myStr1[0:2]:", myStr1[0:2]) // Expected: "te"
	println("myStr1[2:5]:", myStr1[2:5]) // Expected: "sti"
	println("myStr1[5:7]:", myStr1[5:7]) // Expected: "ng"

	// Slicing to the end
	println("myStr1[3:]:", myStr1[3:]) // Expected: "ting"

	// Slicing from the beginning
	println("myStr1[:4]:", myStr1[:4]) // Expected: "test"

	// Slicing the entire string
	println("myStr1[:]:", myStr1[:]) // Expected: "testing"

	// Slicing with Unicode characters
	myStr2 := "你好世界" // "Hello World" in Chinese
	// UTF-8 bytes:
	// 你: E4 BD A0
	// 好: E5 A5 BD
	// 世: E4 B8 96
	// 界: E7 95 8C
	// Combined: E4 BD A0 E5 A5 BD E4 B8 96 E7 95 8C
	println("myStr2:", myStr2)
	println("len(myStr2):", len(myStr2)) // Expected: 12 (3 bytes per char * 4 chars)

	// Slice the first character '你' (3 bytes)
	println("myStr2[0:3]:", myStr2[0:3]) // Expected: "你"

	// Slice the second character '好' (next 3 bytes)
	println("myStr2[3:6]:", myStr2[3:6]) // Expected: "好"

	// Slice '你好' (first 6 bytes)
	println("myStr2[0:6]:", myStr2[0:6]) // Expected: "你好"

	// Slice from middle of a multi-byte char to middle of another - result might be invalid UTF-8 but still a valid slice
	// byteSlice := []byte(myStr2[1:5])
	// NOTE: this would throw an error since this is not possible in JavaScript (converting string to invalid utf-8 then indexing it)
	// instead of implementing this with a hack we chose to just throw an error in this case.
	// println("myStr2[1:5] => bytes:", byteSlice[0], byteSlice[1], byteSlice[2], byteSlice[3]) // Expected: bytes BD A0 E5 A5 (partial 你, partial 好)

	// Empty slices
	println("myStr1[1:1]:", myStr1[1:1]) // Expected: ""
	println("myStr1[0:0]:", myStr1[0:0]) // Expected: ""
	println("myStr1[7:7]:", myStr1[7:7]) // Expected: "" (len is 7, so index 7 is valid for end of slice)

	s := "abc"
	s1 := s[0:1]
	s2 := s[1:2]
	s3 := s[2:3]
	println(s1, s2, s3) // Expected: a b c
}
