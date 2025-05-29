// Generated file based on bytes.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Test 1: Declaration and initialization of []byte
	let b1: $.Bytes = new Uint8Array(0)
	console.log("b1:", b1)

	let b2 = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
	console.log("b2:", b2)

	let b3 = $.stringToBytes("World") // Conversion from string literal
	console.log("b3:", b3)

	// Test 2: Assignment
	b1 = b2
	console.log("b1 after assignment:", b1)

	// Test 3: Conversion from string to []byte
	let s = "GoScript"
	let b4 = $.stringToBytes(s)
	console.log("b4 from string:", b4)

	// Test 4: Conversion from []byte to string
	let s2 = $.bytesToString(b2)
	console.log("s2 from bytes:", s2)

	// Test 5: Accessing elements
	console.log("b2[0]:", b2![0])
	b2![0] = 87 // Change 'H' to 'W'
	console.log("b2 after modification:", b2)
	console.log("s2 after b2 modification (should be 'Hello'):", s2) // Should not change s2

	// Test 6: len and cap
	console.log("len(b2):", $.len(b2), "cap(b2):", $.cap(b2))
	console.log("len(b3):", $.len(b3), "cap(b3):", $.cap(b3))

	// Test 7: append
	let b5 = $.append(b2, 33, 33) // Append "!!"
	console.log("b5 after append:", b5)
	console.log("len(b5):", $.len(b5), "cap(b5):", $.cap(b5))

	let b6 = $.append(b5, $.stringToBytes(" GoScript"))
	console.log("b6 after append slice:", b6)
	console.log("len(b6):", $.len(b6), "cap(b6):", $.cap(b6))
}

