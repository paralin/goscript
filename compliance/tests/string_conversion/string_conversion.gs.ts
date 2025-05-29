// Generated file based on string_conversion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	// === string(string) Conversion ===
	let myVar = "hello world"
	console.log(myVar)

	// === string(rune) Conversion ===
	let r = 65
	let s = $.runeOrStringToString(r)
	console.log(s)

	// 'a'
	let r2: number = 97
	let s2 = $.runeOrStringToString(r2)
	console.log(s2)

	// '€'
	let r3: number = 0x20AC
	let s3 = $.runeOrStringToString(r3)
	console.log(s3)

	// === string([]rune) Conversion ===
	let myRunes = $.arrayToSlice<number>([71, 111, 83, 99, 114, 105, 112, 116])
	let myStringFromRunes = $.runesToString(myRunes)
	console.log(myStringFromRunes)

	let emptyRunes = $.arrayToSlice<number>([])
	let emptyStringFromRunes = $.runesToString(emptyRunes)
	console.log(emptyStringFromRunes)

	// === []rune(string) and string([]rune) Round Trip ===
	let originalString = "你好世界" // Example with multi-byte characters
	let runesFromString = $.stringToRunes(originalString)
	let stringFromRunes = $.runesToString(runesFromString)
	console.log(originalString)
	console.log(stringFromRunes)
	console.log(originalString == stringFromRunes)

	// === Modify []rune and convert back to string ===
	let mutableRunes = $.stringToRunes("Mutable String")
	mutableRunes![0] = 109
	mutableRunes![8] = 115
	let modifiedString = $.runesToString(mutableRunes)
	console.log(modifiedString)
}

