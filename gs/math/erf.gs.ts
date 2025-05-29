import * as $ from "@goscript/builtin/index.js";
import { IsInf, IsNaN, NaN } from "./bits.gs.js";
import { Exp } from "./exp.gs.js";

import { Float64bits, Float64frombits } from "./unsafe.gs.js";

// 0x3FEB0AC160000000
let erx: number = 8.45062911510467529297e-01

// Coefficients for approximation to  erf in [0, 0.84375]
// 0x3FC06EBA8214DB69
let efx: number = 1.28379167095512586316e-01

// 0x3FF06EBA8214DB69
let efx8: number = 1.02703333676410069053e+00

// 0x3FC06EBA8214DB68
let pp0: number = 1.28379167095512558561e-01

// 0xBFD4CD7D691CB913
let pp1: number = -3.25042107247001499370e-01

// 0xBF9D2A51DBD7194F
let pp2: number = -2.84817495755985104766e-02

// 0xBF77A291236668E4
let pp3: number = -5.77027029648944159157e-03

// 0xBEF8EAD6120016AC
let pp4: number = -2.37630166566501626084e-05

// 0x3FD97779CDDADC09
let qq1: number = 3.97917223959155352819e-01

// 0x3FB0A54C5536CEBA
let qq2: number = 6.50222499887672944485e-02

// 0x3F74D022C4D36B0F
let qq3: number = 5.08130628187576562776e-03

// 0x3F215DC9221C1A10
let qq4: number = 1.32494738004321644526e-04

// 0xBED09C4342A26120
let qq5: number = -3.96022827877536812320e-06

// Coefficients for approximation to  erf  in [0.84375, 1.25]
// 0xBF6359B8BEF77538
let pa0: number = -2.36211856075265944077e-03

// 0x3FDA8D00AD92B34D
let pa1: number = 4.14856118683748331666e-01

// 0xBFD7D240FBB8C3F1
let pa2: number = -3.72207876035701323847e-01

// 0x3FD45FCA805120E4
let pa3: number = 3.18346619901161753674e-01

// 0xBFBC63983D3E28EC
let pa4: number = -1.10894694282396677476e-01

// 0x3FA22A36599795EB
let pa5: number = 3.54783043256182359371e-02

// 0xBF61BF380A96073F
let pa6: number = -2.16637559486879084300e-03

// 0x3FBB3E6618EEE323
let qa1: number = 1.06420880400844228286e-01

// 0x3FE14AF092EB6F33
let qa2: number = 5.40397917702171048937e-01

// 0x3FB2635CD99FE9A7
let qa3: number = 7.18286544141962662868e-02

// 0x3FC02660E763351F
let qa4: number = 1.26171219808761642112e-01

// 0x3F8BEDC26B51DD1C
let qa5: number = 1.36370839120290507362e-02

// 0x3F888B545735151D
let qa6: number = 1.19844998467991074170e-02

// Coefficients for approximation to  erfc in [1.25, 1/0.35]
// 0xBF843412600D6435
let ra0: number = -9.86494403484714822705e-03

// 0xBFE63416E4BA7360
let ra1: number = -6.93858572707181764372e-01

// 0xC0251E0441B0E726
let ra2: number = -1.05586262253232909814e+01

// 0xC04F300AE4CBA38D
let ra3: number = -6.23753324503260060396e+01

// 0xC0644CB184282266
let ra4: number = -1.62396669462573470355e+02

// 0xC067135CEBCCABB2
let ra5: number = -1.84605092906711035994e+02

// 0xC054526557E4D2F2
let ra6: number = -8.12874355063065934246e+01

// 0xC023A0EFC69AC25C
let ra7: number = -9.81432934416914548592e+00

// 0x4033A6B9BD707687
let sa1: number = 1.96512716674392571292e+01

// 0x4061350C526AE721
let sa2: number = 1.37657754143519042600e+02

// 0x407B290DD58A1A71
let sa3: number = 4.34565877475229228821e+02

// 0x40842B1921EC2868
let sa4: number = 6.45387271733267880336e+02

// 0x407AD02157700314
let sa5: number = 4.29008140027567833386e+02

// 0x405B28A3EE48AE2C
let sa6: number = 1.08635005541779435134e+02

// 0x401A47EF8E484A93
let sa7: number = 6.57024977031928170135e+00

// 0xBFAEEFF2EE749A62
let sa8: number = -6.04244152148580987438e-02

// Coefficients for approximation to  erfc in [1/.35, 28]
// 0xBF84341239E86F4A
let rb0: number = -9.86494292470009928597e-03

// 0xBFE993BA70C285DE
let rb1: number = -7.99283237680523006574e-01

// 0xC031C209555F995A
let rb2: number = -1.77579549177547519889e+01

// 0xC064145D43C5ED98
let rb3: number = -1.60636384855821916062e+02

// 0xC083EC881375F228
let rb4: number = -6.37566443368389627722e+02

// 0xC09004616A2E5992
let rb5: number = -1.02509513161107724954e+03

// 0xC07E384E9BDC383F
let rb6: number = -4.83519191608651397019e+02

// 0x403E568B261D5190
let sb1: number = 3.03380607434824582924e+01

// 0x40745CAE221B9F0A
let sb2: number = 3.25792512996573918826e+02

// 0x409802EB189D5118
let sb3: number = 1.53672958608443695994e+03

// 0x40A8FFB7688C246A
let sb4: number = 3.19985821950859553908e+03

// 0x40A3F219CEDF3BE6
let sb5: number = 2.55305040643316442583e+03

// 0x407DA874E79FE763
let sb6: number = 4.74528541206955367215e+02

// 0xC03670E242712D62
let sb7: number = -2.24409524465858183362e+01

// Erf returns the error function of x.
//
// Special cases are:
//
//	Erf(+Inf) = 1
//	Erf(-Inf) = -1
//	Erf(NaN) = NaN
export function Erf(x: number): number {
	return erf(x)
}

export function erf(x: number): number {

	// 0x0080000000000000
	// 2**-28
	// 0x0080000000000000
	let VeryTiny: number = 2.848094538889218e-306
	// 2**-28
	let Small: number = 1.0 / ((1 << 28))
	// special cases
	switch (true) {
		case IsNaN(x):
			return NaN()
			break
		case IsInf(x, 1):
			return 1
			break
		case IsInf(x, -1):
			return -1
			break
	}
	let sign = false
	if (x < 0) {
		x = -x
		sign = true
	}
	// |x| < 0.84375

	// |x| < 2**-28

	// avoid underflow
	if (x < 0.84375) {
		// |x| < 0.84375
		let temp: number = 0
		// |x| < 2**-28

		// avoid underflow
		if (x < 3.72529e-09) {
			// |x| < 2**-28

			// avoid underflow
			if (x < 2.84809e-306) {
				temp = 0.125 * (8.0 * x + 1.02703 * x) // avoid underflow
			} else {
				temp = x + 0.128379 * x
			}
		} else {
			let z = x * x
			let r = 0.128379 + z * (-0.325042 + z * (-0.0284817 + z * (-0.00577027 + z * -2.3763e-05)))
			let s = 1 + z * (0.397917 + z * (0.0650222 + z * (0.00508131 + z * (0.000132495 + z * -3.96023e-06))))
			let y = r / s
			temp = x + x * y
		}
		if (sign) {
			return -temp
		}
		return temp
	}
	// 0.84375 <= |x| < 1.25
	if (x < 1.25) {
		// 0.84375 <= |x| < 1.25
		let s = x - 1
		let P = -0.00236212 + s * (0.414856 + s * (-0.372208 + s * (0.318347 + s * (-0.110895 + s * (0.0354783 + s * -0.00216638)))))
		let Q = 1 + s * (0.106421 + s * (0.540398 + s * (0.0718287 + s * (0.126171 + s * (0.0136371 + s * 0.0119845)))))
		if (sign) {
			return -0.845063 - P / Q
		}
		return 0.845063 + P / Q
	}
	// inf > |x| >= 6
	if (x >= 6) {
		// inf > |x| >= 6
		if (sign) {
			return -1
		}
		return 1
	}
	let s = 1 / (x * x)
	let R: number
	let S: number
	// |x| < 1 / 0.35  ~ 2.857143

	// |x| >= 1 / 0.35  ~ 2.857143
	if (x < 1 / 0.35) {
		// |x| < 1 / 0.35  ~ 2.857143
		R = -0.00986494 + s * (-0.693859 + s * (-10.5586 + s * (-62.3753 + s * (-162.397 + s * (-184.605 + s * (-81.2874 + s * -9.81433))))))
		S = 1 + s * (19.6513 + s * (137.658 + s * (434.566 + s * (645.387 + s * (429.008 + s * (108.635 + s * (6.57025 + s * -0.0604244)))))))
	} else {
		// |x| >= 1 / 0.35  ~ 2.857143
		R = -0.00986494 + s * (-0.799283 + s * (-17.758 + s * (-160.636 + s * (-637.566 + s * (-1025.1 + s * -483.519)))))
		S = 1 + s * (30.3381 + s * (325.793 + s * (1536.73 + s * (3199.86 + s * (2553.05 + s * (474.529 + s * -22.441))))))
	}
	let z = Float64frombits((Float64bits(x) & 0xffffffff00000000)) // pseudo-single (20-bit) precision x
	let r = Exp(-z * z - 0.5625) * Exp((z - x) * (z + x) + R / S)
	if (sign) {
		return r / x - 1
	}
	return 1 - r / x
}

// Erfc returns the complementary error function of x.
//
// Special cases are:
//
//	Erfc(+Inf) = 0
//	Erfc(-Inf) = 2
//	Erfc(NaN) = NaN
export function Erfc(x: number): number {
	return erfc(x)
}

export function erfc(x: number): number {
	// 2**-56
	let Tiny: number = 1.0 / ((1 << 56))
	// special cases
	switch (true) {
		case IsNaN(x):
			return NaN()
			break
		case IsInf(x, 1):
			return 0
			break
		case IsInf(x, -1):
			return 2
			break
	}
	let sign = false
	if (x < 0) {
		x = -x
		sign = true
	}
	// |x| < 0.84375

	// |x| < 2**-56

	// |x| < 1/4
	if (x < 0.84375) {
		// |x| < 0.84375
		let temp: number = 0
		// |x| < 2**-56

		// |x| < 1/4
		if (x < 1.38778e-17) {
			// |x| < 2**-56
			temp = x
		} else {
			let z = x * x
			let r = 0.128379 + z * (-0.325042 + z * (-0.0284817 + z * (-0.00577027 + z * -2.3763e-05)))
			let s = 1 + z * (0.397917 + z * (0.0650222 + z * (0.00508131 + z * (0.000132495 + z * -3.96023e-06))))
			let y = r / s
			// |x| < 1/4
			if (x < 0.25) {
				// |x| < 1/4
				temp = x + x * y
			} else {
				temp = 0.5 + (x * y + (x - 0.5))
			}
		}
		if (sign) {
			return 1 + temp
		}
		return 1 - temp
	}
	// 0.84375 <= |x| < 1.25
	if (x < 1.25) {
		// 0.84375 <= |x| < 1.25
		let s = x - 1
		let P = -0.00236212 + s * (0.414856 + s * (-0.372208 + s * (0.318347 + s * (-0.110895 + s * (0.0354783 + s * -0.00216638)))))
		let Q = 1 + s * (0.106421 + s * (0.540398 + s * (0.0718287 + s * (0.126171 + s * (0.0136371 + s * 0.0119845)))))
		if (sign) {
			return 1 + 0.845063 + P / Q
		}
		return 1 - 0.845063 - P / Q

	}
	// |x| < 28

	// |x| < 1 / 0.35 ~ 2.857143

	// |x| >= 1 / 0.35 ~ 2.857143

	// x < -6

	// pseudo-single (20-bit) precision x
	if (x < 28) {
		// |x| < 28
		let s = 1 / (x * x)
		let R: number
		let S: number
		// |x| < 1 / 0.35 ~ 2.857143

		// |x| >= 1 / 0.35 ~ 2.857143

		// x < -6
		if (x < 1 / 0.35) {
			// |x| < 1 / 0.35 ~ 2.857143
			R = -0.00986494 + s * (-0.693859 + s * (-10.5586 + s * (-62.3753 + s * (-162.397 + s * (-184.605 + s * (-81.2874 + s * -9.81433))))))
			S = 1 + s * (19.6513 + s * (137.658 + s * (434.566 + s * (645.387 + s * (429.008 + s * (108.635 + s * (6.57025 + s * -0.0604244)))))))
		} else {
			// |x| >= 1 / 0.35 ~ 2.857143

			// x < -6
			if (sign && x > 6) {
				return 2
			}
			R = -0.00986494 + s * (-0.799283 + s * (-17.758 + s * (-160.636 + s * (-637.566 + s * (-1025.1 + s * -483.519)))))
			S = 1 + s * (30.3381 + s * (325.793 + s * (1536.73 + s * (3199.86 + s * (2553.05 + s * (474.529 + s * -22.441))))))
		}
		let z = Float64frombits((Float64bits(x) & 0xffffffff00000000)) // pseudo-single (20-bit) precision x
		let r = Exp(-z * z - 0.5625) * Exp((z - x) * (z + x) + R / S)
		if (sign) {
			return 2 - r / x
		}
		return r / x
	}
	if (sign) {
		return 2
	}
	return 0
}

