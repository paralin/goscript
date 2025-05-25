// Generated file based on package_import_unicode_utf8.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as utf8 from "@goscript/unicode/utf8/index.js"

export async function main(): Promise<void> {
	// Test basic UTF-8 functions
	let s = "Hello, 世界"

	// Test RuneCountInString
	let count = utf8.RuneCountInString(s)
	console.log("Rune count:", count)

	// Test DecodeRuneInString
	let [r, size] = utf8.DecodeRuneInString(s)
	console.log("First rune:", r, "size:", size)

	// Test ValidString
	let valid = utf8.ValidString(s)
	console.log("Valid UTF-8:", valid)

	// Test with bytes
	let b = $.stringToBytes(s)

	// Test RuneCount
	let byteCount = utf8.RuneCount(b)
	console.log("Byte rune count:", byteCount)

	// Test DecodeRune
	let [br, bsize] = utf8.DecodeRune(b)
	console.log("First rune from bytes:", br, "size:", bsize)

	// Test Valid
	let bvalid = utf8.Valid(b)
	console.log("Valid UTF-8 bytes:", bvalid)

	// Test EncodeRune
	let buf: number[] = [0, 0, 0, 0]
	let n = utf8.EncodeRune($.goSlice(buf, undefined, undefined), 19990)
	console.log("Encoded rune size:", n)

	// Test RuneLen
	let runeLen = utf8.RuneLen(19990)
	console.log("Rune length:", runeLen)

	// Test ValidRune
	let validRune = utf8.ValidRune(19990)
	console.log("Valid rune:", validRune)

	// Test constants
	console.log("RuneSelf:", utf8.RuneSelf)
	console.log("MaxRune:", utf8.MaxRune)
	console.log("UTFMax:", utf8.UTFMax)
}

