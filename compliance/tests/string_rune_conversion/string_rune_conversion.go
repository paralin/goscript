package main

func main() {
	// === string(rune) Conversion ===
	var r rune = 'A'
	s := string(r)
	println(s)

	var r2 rune = 97 // 'a'
	s2 := string(r2)
	println(s2)

	var r3 rune = 0x20AC // '€'
	s3 := string(r3)
	println(s3)
}
