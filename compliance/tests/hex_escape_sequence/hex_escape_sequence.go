package main

func main() {
	// Test hexadecimal escape sequences in string literals
	// This should reproduce the error: TS1125: Hexadecimal digit expected.

	// This reproduces the original error: buf = $.append(buf, `\x`)
	var buf []byte
	buf = append(buf, `\x`...)
	println("Appended raw string with \\x:", string(buf))

	// Raw string with incomplete hex escape
	s1 := `\x` // This should be treated as literal \x
	println("Raw string with \\x:", s1)

	// Raw string with \x followed by non-hex
	s2 := `\xG` // This should be treated as literal \xG
	println("Raw string with \\xG:", s2)

	// Interpreted string with \x escape sequence
	s3 := "\x41" // This should be treated as hex escape for 'A'
	println("Interpreted string:", s3)
}
