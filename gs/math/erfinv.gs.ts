import * as $ from "@goscript/builtin/builtin.js";
import { Inf, IsNaN, NaN } from "./bits.gs.js";
import { Log } from "./log.gs.js";
import { Sqrt } from "./sqrt.gs.js";

// Coefficients for approximation to erf in |x| <= 0.85
let a0: number = 1.1975323115670912564578e0

let a1: number = 4.7072688112383978012285e1

let a2: number = 6.9706266534389598238465e2

let a3: number = 4.8548868893843886794648e3

let a4: number = 1.6235862515167575384252e4

let a5: number = 2.3782041382114385731252e4

let a6: number = 1.1819493347062294404278e4

let a7: number = 8.8709406962545514830200e2

let b0: number = 1.0000000000000000000e0

let b1: number = 4.2313330701600911252e1

let b2: number = 6.8718700749205790830e2

let b3: number = 5.3941960214247511077e3

let b4: number = 2.1213794301586595867e4

let b5: number = 3.9307895800092710610e4

let b6: number = 2.8729085735721942674e4

let b7: number = 5.2264952788528545610e3

// Coefficients for approximation to erf in 0.85 < |x| <= 1-2*exp(-25)
let c0: number = 1.42343711074968357734e0

let c1: number = 4.63033784615654529590e0

let c2: number = 5.76949722146069140550e0

let c3: number = 3.64784832476320460504e0

let c4: number = 1.27045825245236838258e0

let c5: number = 2.41780725177450611770e-1

let c6: number = 2.27238449892691845833e-2

let c7: number = 7.74545014278341407640e-4

let d0: number = 1.4142135623730950488016887e0

let d1: number = 2.9036514445419946173133295e0

let d2: number = 2.3707661626024532365971225e0

let d3: number = 9.7547832001787427186894837e-1

let d4: number = 2.0945065210512749128288442e-1

let d5: number = 2.1494160384252876777097297e-2

let d6: number = 7.7441459065157709165577218e-4

let d7: number = 1.4859850019840355905497876e-9

// Coefficients for approximation to erf in 1-2*exp(-25) < |x| < 1
let e0: number = 6.65790464350110377720e0

let e1: number = 5.46378491116411436990e0

let e2: number = 1.78482653991729133580e0

let e3: number = 2.96560571828504891230e-1

let e4: number = 2.65321895265761230930e-2

let e5: number = 1.24266094738807843860e-3

let e6: number = 2.71155556874348757815e-5

let e7: number = 2.01033439929228813265e-7

let f0: number = 1.414213562373095048801689e0

let f1: number = 8.482908416595164588112026e-1

let f2: number = 1.936480946950659106176712e-1

let f3: number = 2.103693768272068968719679e-2

let f4: number = 1.112800997078859844711555e-3

let f5: number = 2.611088405080593625138020e-5

let f6: number = 2.010321207683943062279931e-7

let f7: number = 2.891024605872965461538222e-15

// Erfinv returns the inverse error function of x.
//
// Special cases are:
//
//	Erfinv(1) = +Inf
//	Erfinv(-1) = -Inf
//	Erfinv(x) = NaN if x < -1 or x > 1
//	Erfinv(NaN) = NaN
export function Erfinv(x: number): number {
	// special cases
	if (IsNaN(x) || x <= -1 || x >= 1) {
		if (x == -1 || x == 1) {
			return Inf($.int(x))
		}
		return NaN()
	}

	let sign = false
	if (x < 0) {
		x = -x
		sign = true
	}

	let ans: number = 0
	// |x| <= 0.85
	if (x <= 0.85) {
		// |x| <= 0.85
		let r = 0.180625 - 0.25 * x * x
		let z1 = ((((((887.094 * r + 11819.5) * r + 23782.041382114385) * r + 16235.9) * r + 4854.89) * r + 697.063) * r + 47.0727) * r + 1.19753
		let z2 = ((((((5226.5 * r + 28729.1) * r + 39307.9) * r + 21213.8) * r + 5394.2) * r + 687.187) * r + 42.3133) * r + 1
		ans = (x * z1) / z2
	} else {
		  let z1: number
  let z2: number
		let r = Sqrt(0.693147 - Log(1.0 - x))
		if (r <= 5.0) {
			r -= 1.6
			z1 = ((((((0.000774545 * r + 0.0227238) * r + 0.241781) * r + 1.27046) * r + 3.64785) * r + 5.7695) * r + 4.63034) * r + 1.42344
			z2 = ((((((1.48599e-09 * r + 0.000774415) * r + 0.0214942) * r + 0.209451) * r + 0.975478) * r + 2.37077) * r + 2.90365) * r + 1.41421
		} else {
			r -= 5.0
			z1 = ((((((2.01033e-07 * r + 2.71156e-05) * r + 0.00124266) * r + 0.0265322) * r + 0.296561) * r + 1.78483) * r + 5.46378) * r + 6.6579
			z2 = ((((((2.89102e-15 * r + 2.01032e-07) * r + 2.61109e-05) * r + 0.0011128) * r + 0.0210369) * r + 0.193648) * r + 0.848291) * r + 1.41421
		}
		ans = z1 / z2
	}

	if (sign) {
		return -ans
	}
	return ans
}

// Erfcinv returns the inverse of [Erfc](x).
//
// Special cases are:
//
//	Erfcinv(0) = +Inf
//	Erfcinv(2) = -Inf
//	Erfcinv(x) = NaN if x < 0 or x > 2
//	Erfcinv(NaN) = NaN
export function Erfcinv(x: number): number {
	return Erfinv(1 - x)
}

