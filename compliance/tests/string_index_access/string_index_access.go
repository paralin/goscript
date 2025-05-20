package main

func main() {
	myStr1 := "testing"
	println("Byte from myStr1[0]:", myStr1[0]) // Expected: t (byte value 116)
	println("Byte from myStr1[2]:", myStr1[2]) // Expected: s (byte value 115)
	println("Byte from myStr1[6]:", myStr1[6]) // Expected: g (byte value 103)

	myStr2 := "你好世界" // "Hello World" in Chinese
	// Accessing bytes of multi-byte characters
	// '你' is E4 BD A0 in UTF-8
	// '好' is E5 A5 BD in UTF-8
	// '世' is E4 B8 96 in UTF-8
	// '界' is E7 95 C2 8C in UTF-8 (界 seems to be E7 95 8C, let's assume 3 bytes for simplicity in this example)
	// For "你好世界", bytes are: E4 BD A0 E5 A5 BD E4 B8 96 E7 95 8C
	println("Byte from myStr2[0]:", myStr2[0]) // Expected: E4 (byte value 228) - First byte of '你'
	println("Byte from myStr2[1]:", myStr2[1]) // Expected: BD (byte value 189) - Second byte of '你'
	println("Byte from myStr2[2]:", myStr2[2]) // Expected: A0 (byte value 160) - Third byte of '你'
	println("Byte from myStr2[3]:", myStr2[3]) // Expected: E5 (byte value 229) - First byte of '好'
}
