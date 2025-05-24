// Generated file based on generics_leading_int.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

// leadingInt consumes the leading [0-9]* from s.
function leadingInt<bytes extends Uint8Array | string>(s: bytes): [number, bytes, boolean] {
	let x: number = 0
	let rem: bytes = null!
	let err: boolean = false
	{
		let i = 0

		// overflow

		// overflow
		for (; i < $.len(s); i++) {
			let c = $.indexStringOrBytes(s, i)
			if (c < 48 || c > 57) {
				break
			}

			// overflow
			if (x > Number.MAX_SAFE_INTEGER / 10) {
				// overflow
				return [0, $.sliceStringOrBytes(s, $.len(s), undefined), true]
			}
			x = x * 10 + (c as number) - 48

			// overflow
			if (x > Number.MAX_SAFE_INTEGER) {
				// overflow
				return [0, $.sliceStringOrBytes(s, $.len(s), undefined), true]
			}
		}
		return [x, $.sliceStringOrBytes(s, i, undefined), false]
	}
}

export async function main(): Promise<void> {
	let [x1, rem1, err1] = leadingInt($.stringToBytes("123abc456"))
	console.log(x1, $.bytesToString(rem1), err1)

	let [x2, rem2, err2] = leadingInt("456def123")
	console.log(x2, rem2, err2)

	let [x3, rem3, err3] = leadingInt("abc")
	console.log(x3, rem3, err3)

	// Test overflow
	let [x4, rem4, err4] = leadingInt("999999999999999999999999999999")
	console.log(x4, rem4, err4)

	let [x5, rem5, err5] = leadingInt<string>("123")
	console.log(x5, rem5, err5)
}

