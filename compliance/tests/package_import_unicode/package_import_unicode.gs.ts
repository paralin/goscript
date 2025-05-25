// Generated file based on package_import_unicode.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as unicode from "@goscript/unicode/index.js"

export async function main(): Promise<void> {
	// Test character classification functions
	console.log("Testing character classification:")

	// Test IsLetter
	console.log("IsLetter('A'):", unicode.IsLetter(65))
	console.log("IsLetter('1'):", unicode.IsLetter(49))

	// Test IsDigit
	console.log("IsDigit('5'):", unicode.IsDigit(53))
	console.log("IsDigit('a'):", unicode.IsDigit(97))

	// Test IsUpper
	console.log("IsUpper('Z'):", unicode.IsUpper(90))
	console.log("IsUpper('z'):", unicode.IsUpper(122))

	// Test IsLower
	console.log("IsLower('b'):", unicode.IsLower(98))
	console.log("IsLower('B'):", unicode.IsLower(66))

	// Test IsSpace
	console.log("IsSpace(' '):", unicode.IsSpace(32))
	console.log("IsSpace('x'):", unicode.IsSpace(120))

	// Test IsPunct
	console.log("IsPunct('!'):", unicode.IsPunct(33))
	console.log("IsPunct('a'):", unicode.IsPunct(97))

	// Test case conversion functions
	console.log("\nTesting case conversion:")

	// Test ToUpper
	console.log("ToUpper('a'):", String.fromCharCode(unicode.ToUpper(97)))
	console.log("ToUpper('Z'):", String.fromCharCode(unicode.ToUpper(90)))

	// Test ToLower
	console.log("ToLower('A'):", String.fromCharCode(unicode.ToLower(65)))
	console.log("ToLower('z'):", String.fromCharCode(unicode.ToLower(122)))

	// Test ToTitle
	console.log("ToTitle('a'):", String.fromCharCode(unicode.ToTitle(97)))

	// Test To function with constants
	console.log("To(UpperCase, 'b'):", String.fromCharCode(unicode.To(unicode.UpperCase, 98)))
	console.log("To(LowerCase, 'C'):", String.fromCharCode(unicode.To(unicode.LowerCase, 67)))

	// Test SimpleFold
	console.log("SimpleFold('A'):", String.fromCharCode(unicode.SimpleFold(65)))
	console.log("SimpleFold('a'):", String.fromCharCode(unicode.SimpleFold(97)))

	// Test constants
	console.log("\nTesting constants:")
	console.log("MaxRune:", unicode.MaxRune)
	console.log("Version:", unicode.Version)

	// Test range tables with Is function
	console.log("\nTesting range tables:")
	console.log("Is(Letter, 'A'):", unicode.Is(unicode.Letter, 65))
	console.log("Is(Letter, '1'):", unicode.Is(unicode.Letter, 49))
	console.log("Is(Digit, '5'):", unicode.Is(unicode.Digit, 53))
	console.log("Is(Digit, 'x'):", unicode.Is(unicode.Digit, 120))

	// Test In function
	console.log("In('A', Letter, Digit):", unicode.In(65, unicode.Letter, unicode.Digit))
	console.log("In('5', Letter, Digit):", unicode.In(53, unicode.Letter, unicode.Digit))
	console.log("In('!', Letter, Digit):", unicode.In(33, unicode.Letter, unicode.Digit))

	console.log("test finished")
}

