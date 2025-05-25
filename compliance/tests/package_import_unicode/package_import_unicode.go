package main

import "unicode"

func main() {
	// Test character classification functions
	println("Testing character classification:")

	// Test IsLetter
	println("IsLetter('A'):", unicode.IsLetter('A'))
	println("IsLetter('1'):", unicode.IsLetter('1'))

	// Test IsDigit
	println("IsDigit('5'):", unicode.IsDigit('5'))
	println("IsDigit('a'):", unicode.IsDigit('a'))

	// Test IsUpper
	println("IsUpper('Z'):", unicode.IsUpper('Z'))
	println("IsUpper('z'):", unicode.IsUpper('z'))

	// Test IsLower
	println("IsLower('b'):", unicode.IsLower('b'))
	println("IsLower('B'):", unicode.IsLower('B'))

	// Test IsSpace
	println("IsSpace(' '):", unicode.IsSpace(' '))
	println("IsSpace('x'):", unicode.IsSpace('x'))

	// Test IsPunct
	println("IsPunct('!'):", unicode.IsPunct('!'))
	println("IsPunct('a'):", unicode.IsPunct('a'))

	// Test case conversion functions
	println("\nTesting case conversion:")

	// Test ToUpper
	println("ToUpper('a'):", string(unicode.ToUpper('a')))
	println("ToUpper('Z'):", string(unicode.ToUpper('Z')))

	// Test ToLower
	println("ToLower('A'):", string(unicode.ToLower('A')))
	println("ToLower('z'):", string(unicode.ToLower('z')))

	// Test ToTitle
	println("ToTitle('a'):", string(unicode.ToTitle('a')))

	// Test To function with constants
	println("To(UpperCase, 'b'):", string(unicode.To(unicode.UpperCase, 'b')))
	println("To(LowerCase, 'C'):", string(unicode.To(unicode.LowerCase, 'C')))

	// Test SimpleFold
	println("SimpleFold('A'):", string(unicode.SimpleFold('A')))
	println("SimpleFold('a'):", string(unicode.SimpleFold('a')))

	// Test constants
	println("\nTesting constants:")
	println("MaxRune:", unicode.MaxRune)
	println("Version:", unicode.Version)

	// Test range tables with Is function
	println("\nTesting range tables:")
	println("Is(Letter, 'A'):", unicode.Is(unicode.Letter, 'A'))
	println("Is(Letter, '1'):", unicode.Is(unicode.Letter, '1'))
	println("Is(Digit, '5'):", unicode.Is(unicode.Digit, '5'))
	println("Is(Digit, 'x'):", unicode.Is(unicode.Digit, 'x'))

	// Test In function
	println("In('A', Letter, Digit):", unicode.In('A', unicode.Letter, unicode.Digit))
	println("In('5', Letter, Digit):", unicode.In('5', unicode.Letter, unicode.Digit))
	println("In('!', Letter, Digit):", unicode.In('!', unicode.Letter, unicode.Digit))

	println("test finished")
}
