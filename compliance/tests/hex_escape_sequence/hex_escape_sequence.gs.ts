// Generated file based on hex_escape_sequence.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	// Test hexadecimal escape sequences in string literals
	// This should reproduce the error: TS1125: Hexadecimal digit expected.

	// This reproduces the original error: buf = $.append(buf, `\x`)
	let buf: $.Bytes = new Uint8Array(0)
	buf = $.append(buf, ...$.stringToBytes("\\x"))
	console.log("Appended raw string with \\x:", $.bytesToString(buf))

	// Raw string with incomplete hex escape
	let s1 = "\\x" // This should be treated as literal \x
	console.log("Raw string with \\x:", s1)

	// Raw string with \x followed by non-hex
	let s2 = "\\xG" // This should be treated as literal \xG
	console.log("Raw string with \\xG:", s2)

	// Interpreted string with \x escape sequence
	let s3 = "\x41" // This should be treated as hex escape for 'A'
	console.log("Interpreted string:", s3)
}

