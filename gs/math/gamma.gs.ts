import * as $ from "@goscript/builtin/builtin.js";
import { Abs } from "./abs.gs.js";
import { Inf, IsInf, IsNaN, NaN } from "./bits.gs.js";
import { Exp } from "./exp.gs.js";
import { Floor } from "./floor.gs.js";
import { Modf } from "./modf.gs.js";
import { Pow } from "./pow.gs.js";
import { Signbit } from "./signbit.gs.js";
import { Sin } from "./sin.gs.js";

let _gamP = $.arrayToSlice<number>([1.60119522476751861407e-04, 1.19135147006586384913e-03, 1.04213797561761569935e-02, 4.76367800457137231464e-02, 2.07448227648435975150e-01, 4.94214826801497100753e-01, 9.99999999999999996796e-01])

let _gamQ = $.arrayToSlice<number>([-2.31581873324120129819e-05, 5.39605580493303397842e-04, -4.45641913851797240494e-03, 1.18139785222060435552e-02, 3.58236398605498653373e-02, -2.34591795718243348568e-01, 7.14304917030273074085e-02, 1.00000000000000000320e+00])

let _gamS = $.arrayToSlice<number>([7.87311395793093628397e-04, -2.29549961613378126380e-04, -2.68132617805781232825e-03, 3.47222221605458667310e-03, 8.33333333333482257126e-02])

// Gamma function computed by Stirling's formula.
// The pair of results must be multiplied together to get the actual answer.
// The multiplication is left to the caller so that, if careful, the caller can avoid
// infinity for 172 <= x <= 180.
// The polynomial is valid for 33 <= x <= 172; larger values are only used
// in reciprocal and produce denormalized floats. The lower precision there
// masks any imprecision in the polynomial.
export function stirling(x: number): [number, number] {
	if (x > 200) {
		return [Inf(1), 1]
	}
	let SqrtTwoPi: number = 2.506628274631000502417
	let MaxStirling: number = 143.01608
	let w = 1 / x
	w = 1 + w * ((((_gamS![0] * w + _gamS![1]) * w + _gamS![2]) * w + _gamS![3]) * w + _gamS![4])
	let y1 = Exp(x)
	let y2 = 1.0
	// avoid Pow() overflow
	if (x > 143.016) {
		// avoid Pow() overflow
		let v = Pow(x, 0.5 * x - 0.25)
		y1 = v
		y2 = v / y1
	} else {
		y1 = Pow(x, x - 0.5) / y1
	}
	return [y1, 2.50663 * w * y2]
}

// Gamma returns the Gamma function of x.
//
// Special cases are:
//
//	Gamma(+Inf) = +Inf
//	Gamma(+0) = +Inf
//	Gamma(-0) = -Inf
//	Gamma(x) = NaN for integer x < 0
//	Gamma(-Inf) = NaN
//	Gamma(NaN) = NaN
export function Gamma(x: number): number {
	// A001620
	let Euler: number = 0.57721566490153286060651209008240243104215933593992
	// special cases
	switch (true) {
		case isNegInt(x) || IsInf(x, -1) || IsNaN(x):
			return NaN()
			break
		case IsInf(x, 1):
			return Inf(1)
			break
		case x == 0:
			if (Signbit(x)) {
				return Inf(-1)
			}
			return Inf(1)
			break
	}
	let q = Abs(x)
	let p = Floor(q)

	// Note: x is negative but (checked above) not a negative integer,
	// so x must be small enough to be in range for conversion to int64.
	// If |x| were >= 2⁶³ it would have to be an integer.
	if (q > 33) {
		if (x >= 0) {
			let [y1, y2] = stirling(x)
			return y1 * y2
		}
		// Note: x is negative but (checked above) not a negative integer,
		// so x must be small enough to be in range for conversion to int64.
		// If |x| were >= 2⁶³ it would have to be an integer.
		let signgam = 1
		{
			let ip = (p as number)
			if ((ip & 1) == 0) {
				signgam = -1
			}
		}
		let z = q - p
		if (z > 0.5) {
			p = p + 1
			z = q - p
		}
		z = q * Sin(3.14159 * z)
		if (z == 0) {
			return Inf(signgam)
		}
		let [sq1, sq2] = stirling(q)
		let absz = Abs(z)
		let d = absz * sq1 * sq2
		if (IsInf(d, 0)) {
			z = 3.14159 / absz / sq1 / sq2
		} else {
			z = 3.14159 / d
		}
		return (signgam as number) * z
	}

	// Reduce argument
	let z = 1.0
	for (; x >= 3; ) {
		x = x - 1
		z = z * x
	}
	for (; x < 0; ) {
		if (x > -1e-09) {
			// unhandled branch statement token: goto
		}
		z = z / x
		x = x + 1
	}
	for (; x < 2; ) {
		if (x < 1e-09) {
			// unhandled branch statement token: goto
		}
		z = z / x
		x = x + 1
	}

	if (x == 2) {
		return z
	}

	x = x - 2
	p = (((((x * _gamP![0] + _gamP![1]) * x + _gamP![2]) * x + _gamP![3]) * x + _gamP![4]) * x + _gamP![5]) * x + _gamP![6]
	q = ((((((x * _gamQ![0] + _gamQ![1]) * x + _gamQ![2]) * x + _gamQ![3]) * x + _gamQ![4]) * x + _gamQ![5]) * x + _gamQ![6]) * x + _gamQ![7]
	return z * p / q

	small: if (x == 0) {
		return Inf(1)
	}
	return z / ((1 + 0.577216 * x) * x)
}

export function isNegInt(x: number): boolean {
	if (x < 0) {
		let [, xf] = Modf(x)
		return xf == 0
	}
	return false
}

