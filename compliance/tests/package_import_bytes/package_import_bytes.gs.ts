// Generated file based on package_import_bytes.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as bytes from "@goscript/bytes/index.js"

export async function main(): Promise<void> {
	// Test basic byte slice operations
	let b1 = $.stringToBytes("hello")
	let b2 = $.stringToBytes("world")

	// Test Equal
	if (bytes.Equal(b1, b1)) {
		console.log("Equal works correctly")
	}

	// Test Compare
	let result = bytes.Compare(b1, b2)
	if (result < 0) {
		console.log("Compare works: hello < world")
	}

	// Test Contains
	if (bytes.Contains(b1, $.stringToBytes("ell"))) {
		console.log("Contains works correctly")
	}

	// Test Index
	let idx = bytes.Index(b1, $.stringToBytes("ll"))
	if (idx == 2) {
		console.log("Index works correctly, found at position:", idx)
	}

	// Test Join
	let slices = $.arrayToSlice<$.Bytes>([b1, b2], 2)
	let joined = bytes.Join(slices, $.stringToBytes(" "))
	console.log("Joined:", $.bytesToString(joined))

	// Test Split
	let split = bytes.Split(joined, $.stringToBytes(" "))
	console.log("Split result length:", $.len(split))
	if ($.len(split) == 2) {
		console.log("Split works correctly")
	}

	// Test HasPrefix and HasSuffix
	if (bytes.HasPrefix(b1, $.stringToBytes("he"))) {
		console.log("HasPrefix works correctly")
	}

	if (bytes.HasSuffix(b1, $.stringToBytes("lo"))) {
		console.log("HasSuffix works correctly")
	}

	// Test Trim functions
	let whitespace = $.stringToBytes("  hello  ")
	let trimmed = bytes.TrimSpace(whitespace)
	console.log("Trimmed:", $.bytesToString(trimmed))

	// Test ToUpper and ToLower
	let upper = bytes.ToUpper(b1)
	let lower = bytes.ToLower(upper)
	console.log("Upper:", $.bytesToString(upper))
	console.log("Lower:", $.bytesToString(lower))

	// Test Repeat
	let repeated = bytes.Repeat($.stringToBytes("x"), 3)
	console.log("Repeated:", $.bytesToString(repeated))

	// Test Count
	let count = bytes.Count($.stringToBytes("banana"), $.stringToBytes("a"))
	console.log("Count of 'a' in 'banana':", count)

	// Test Replace
	let replaced = bytes.Replace($.stringToBytes("hello hello"), $.stringToBytes("hello"), $.stringToBytes("hi"), 1)
	console.log("Replace result:", $.bytesToString(replaced))

	// Test ReplaceAll
	let replacedAll = bytes.ReplaceAll($.stringToBytes("hello hello"), $.stringToBytes("hello"), $.stringToBytes("hi"))
	console.log("ReplaceAll result:", $.bytesToString(replacedAll))

	// Test Buffer
	let buf: bytes.Buffer = new bytes.Buffer()
	buf.WriteString("Hello ")
	buf.WriteString("World")
	console.log("Buffer content:", buf.String())
	console.log("Buffer length:", buf.Len())

	// Test Buffer Read
	let data = new Uint8Array(5)
	let [n, ] = buf.Read(data)
	console.log("Read", n, "bytes:", $.bytesToString(data))

	// Test Buffer Reset
	buf.Reset()
	console.log("Buffer after reset, length:", buf.Len())

	console.log("test finished")
}

