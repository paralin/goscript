// Generated file based on string_conversion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	// === string(string) Conversion ===
	let myVar = "hello world"
	console.log(myVar)
	
	// === string(rune) Conversion ===
	let r = 65
	let s = String.fromCharCode(r)
	console.log(s)
	
	// 'a'
	let r2: number = 97;
	let s2 = String.fromCharCode(r2)
	console.log(s2)
	
	// '€'
	let r3: number = 0x20AC;
	let s3 = String.fromCharCode(r3)
	console.log(s3)
	
	// === string([]rune) Conversion ===
	let myRunes = [71, 111, 83, 99, 114, 105, 112, 116]
	let myStringFromRunes = goscript.runesToString(myRunes)
	console.log(myStringFromRunes)
	
	let emptyRunes = []
	let emptyStringFromRunes = goscript.runesToString(emptyRunes)
	console.log(emptyStringFromRunes)
}

