import * as $ from "@goscript/builtin/builtin.js";
import { Float64bits, Float64frombits } from "./unsafe.gs.js";

import * as bits from "@goscript/math/bits/index.js"

let reduceThreshold: number = (1 << 29)

// trigReduce implements Payne-Hanek range reduction by Pi/4
// for x > 0. It returns the integer part mod 8 (j) and
// the fractional part (z) of x / (Pi/4).
// The implementation is based on:
// "ARGUMENT REDUCTION FOR HUGE ARGUMENTS: Good to the Last Bit"
// K. C. Ng et al, March 24, 1992
// The simulated multi-precision calculation of x*B uses 64-bit integer arithmetic.
export function trigReduce(x: number): [number, number] {
	let j: number = 0
	let z: number = 0
	{
		let PI4: number = 3.14159 / 4
		if (x < 0.785398) {
			return [0, x]
		}
		// Extract out the integer and exponent such that,
		// x = ix * 2 ** exp.
		let ix = Float64bits(x)
		let exp = $.int(((ix >> 52) & 2047)) - 1023 - 52
		ix &= ~(2047 << 52)
		ix |= (1 << 52)
		// Use the exponent to extract the 3 appropriate uint64 digits from mPi4,
		// B ~ (z0, z1, z2), such that the product leading digit has the exponent -61.
		// Note, exp >= -53 since x >= PI4 and exp < 971 for maximum float64.
		let [digit, bitshift] = [$.int((exp + 61) / 64), (exp + 61) % 64]
		let z0 = (((mPi4![digit] << bitshift)) | ((mPi4![digit + 1] >> (64 - bitshift))))
		let z1 = (((mPi4![digit + 1] << bitshift)) | ((mPi4![digit + 2] >> (64 - bitshift))))
		let z2 = (((mPi4![digit + 2] << bitshift)) | ((mPi4![digit + 3] >> (64 - bitshift))))
		// Multiply mantissa by the digits and extract the upper two digits (hi, lo).
		let [z2hi, ] = bits.Mul64(BigInt(z2), BigInt(ix))
		let [z1hi, z1lo] = bits.Mul64(BigInt(z1), BigInt(ix))
		let z0lo = BigInt(z0 * ix)
		let [lo, c] = bits.Add64(z1lo, z2hi, 0n)
		let [hi, ] = bits.Add64(z0lo, z1hi, c)
		// The top 3 bits are j.
		j = Number(hi >> 61n)
		// Extract the fraction and find its magnitude.
		hi = ((hi << 3n) | (lo >> 61n))
		let lz = bits.LeadingZeros64(hi)
		let e = 1023 - (lz + 1)
		// Clear implicit mantissa bit and shift into place.
		hi = (((hi << BigInt(lz + 1))) | ((lo >> BigInt(64 - (lz + 1)))))
		hi >>= 64n - 52n
		// Include the exponent and convert to a float.
		hi |= BigInt(e) << 52n
		z = Float64frombits(Number(hi))
		// Map zeros to origin.
		if ((j & 1) == 1) {
			j++
			j &= 7
			z--
		}
		// Multiply the fractional part by pi/4.
		return [j, z * 0.785398]
	}
}

let mPi4 = $.arrayToSlice<number>([0x0000000000000001, 0x45f306dc9c882a53, 0xf84eafa3ea69bb81, 0xb6c52b3278872083, 0xfca2c757bd778ac3, 0x6e48dc74849ba5c0, 0x0c925dd413a32439, 0xfc3bd63962534e7d, 0xd1046bea5d768909, 0xd338e04d68befc82, 0x7323ac7306a673e9, 0x3908bf177bf25076, 0x3ff12fffbc0b301f, 0xde5e2316b414da3e, 0xda6cfd9e4f96136e, 0x9e8c7ecd3cbfd45a, 0xea4f758fd7cbe2f6, 0x7a0e73ef14a525d4, 0xd7f6bf623f1aba10, 0xac06608df8f6d757])

