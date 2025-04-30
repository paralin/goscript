package main

func main() {
	var a int = 5
	a += 3
	println(a) // Expected output: 8

	var b int = 10
	b -= 2
	println(b) // Expected output: 8

	var c int = 16
	c /= 4
	println(c) // Expected output: 4

	var d int = 3
	d *= 5
	println(d) // Expected output: 15

	var e int = 10
	e %= 3
	println(e) // Expected output: 1

	var f int = 5
	f &= 3     // 101 & 011 = 001
	println(f) // Expected output: 1

	var g int = 5
	g |= 3     // 101 | 011 = 111
	println(g) // Expected output: 7

	var h int = 5
	h ^= 3     // 101 ^ 011 = 110
	println(h) // Expected output: 6

	// This operation is not yet supported.
	// var i int = 5
	// i &^= 3    // 101 &^ 011 = 101 & (~011) = 101 & 100 = 100
	// println(i) // Expected output: 4

	var j int = 5
	j <<= 1    // 101 << 1 = 1010
	println(j) // Expected output: 10

	var k int = 5
	k >>= 1    // 101 >> 1 = 010
	println(k) // Expected output: 2
}
