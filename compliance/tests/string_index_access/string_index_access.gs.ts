// Generated file based on string_index_access.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export async function main(): Promise<void> {
	let myStr1 = "testing"
	console.log("Byte from myStr1[0]:", $.indexString(myStr1, 0)) // Expected: t (byte value 116)
	console.log("Byte from myStr1[2]:", $.indexString(myStr1, 2)) // Expected: s (byte value 115)
	console.log("Byte from myStr1[6]:", $.indexString(myStr1, 6)) // Expected: g (byte value 103)

	let myStr2 = "你好世界" // "Hello World" in Chinese
	// Accessing bytes of multi-byte characters
	// '你' is E4 BD A0 in UTF-8
	// '好' is E5 A5 BD in UTF-8
	// '世' is E4 B8 96 in UTF-8
	// '界' is E7 95 C2 8C in UTF-8 (界 seems to be E7 95 8C, let's assume 3 bytes for simplicity in this example)
	// For "你好世界", bytes are: E4 BD A0 E5 A5 BD E4 B8 96 E7 95 8C
	console.log("Byte from myStr2[0]:", $.indexString(myStr2, 0)) // Expected: E4 (byte value 228) - First byte of '你'
	console.log("Byte from myStr2[1]:", $.indexString(myStr2, 1)) // Expected: BD (byte value 189) - Second byte of '你'
	console.log("Byte from myStr2[2]:", $.indexString(myStr2, 2)) // Expected: A0 (byte value 160) - Third byte of '你'
	console.log("Byte from myStr2[3]:", $.indexString(myStr2, 3)) // Expected: E5 (byte value 229) - First byte of '好'
}

