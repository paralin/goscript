package main

// leadingInt consumes the leading [0-9]* from s.
func leadingInt[bytes []byte | string](s bytes) (x uint64, rem bytes, err bool) {
	i := 0
	for ; i < len(s); i++ {
		c := s[i]
		if c < '0' || c > '9' {
			break
		}
		if x > 1<<63/10 {
			// overflow
			return 0, s[len(s):], true
		}
		x = x*10 + uint64(c) - '0'
		if x > 1<<63 {
			// overflow
			return 0, s[len(s):], true
		}
	}
	return x, s[i:], false
}

func main() {
	x1, rem1, err1 := leadingInt([]byte("123abc456"))
	println(x1, string(rem1), err1)

	x2, rem2, err2 := leadingInt("456def123")
	println(x2, string(rem2), err2)

	x3, rem3, err3 := leadingInt("abc")
	println(x3, string(rem3), err3)

	// Test overflow
	x4, rem4, err4 := leadingInt("999999999999999999999999999999") // This will overflow uint64 during intermediate calculation
	println(x4, string(rem4), err4)

	x5, rem5, err5 := leadingInt[string]("123")
	println(x5, string(rem5), err5)
}
