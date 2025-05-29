import * as $ from "@goscript/builtin/index.js";
import { Abs } from "./abs.gs.js";
import { Inf, IsInf, IsNaN } from "./bits.gs.js";
import { Floor } from "./floor.gs.js";
import { Log } from "./log.gs.js";
import { Mod } from "./mod.gs.js";
import { Cos, Sin } from "./sin.gs.js";
import { Float64bits } from "./unsafe.gs.js";

let _lgamA = $.arrayToSlice<number>([7.72156649015328655494e-02, 3.22467033424113591611e-01, 6.73523010531292681824e-02, 2.05808084325167332806e-02, 7.38555086081402883957e-03, 2.89051383673415629091e-03, 1.19270763183362067845e-03, 5.10069792153511336608e-04, 2.20862790713908385557e-04, 1.08011567247583939954e-04, 2.52144565451257326939e-05, 4.48640949618915160150e-05])

let _lgamR = $.arrayToSlice<number>([1.0, 1.39200533467621045958e+00, 7.21935547567138069525e-01, 1.71933865632803078993e-01, 1.86459191715652901344e-02, 7.77942496381893596434e-04, 7.32668430744625636189e-06])

let _lgamS = $.arrayToSlice<number>([-7.72156649015328655494e-02, 2.14982415960608852501e-01, 3.25778796408930981787e-01, 1.46350472652464452805e-01, 2.66422703033638609560e-02, 1.84028451407337715652e-03, 3.19475326584100867617e-05])

let _lgamT = $.arrayToSlice<number>([4.83836122723810047042e-01, -1.47587722994593911752e-01, 6.46249402391333854778e-02, -3.27885410759859649565e-02, 1.79706750811820387126e-02, -1.03142241298341437450e-02, 6.10053870246291332635e-03, -3.68452016781138256760e-03, 2.25964780900612472250e-03, -1.40346469989232843813e-03, 8.81081882437654011382e-04, -5.38595305356740546715e-04, 3.15632070903625950361e-04, -3.12754168375120860518e-04, 3.35529192635519073543e-04])

let _lgamU = $.arrayToSlice<number>([-7.72156649015328655494e-02, 6.32827064025093366517e-01, 1.45492250137234768737e+00, 9.77717527963372745603e-01, 2.28963728064692451092e-01, 1.33810918536787660377e-02])

let _lgamV = $.arrayToSlice<number>([1.0, 2.45597793713041134822e+00, 2.12848976379893395361e+00, 7.69285150456672783825e-01, 1.04222645593369134254e-01, 3.21709242282423911810e-03])

let _lgamW = $.arrayToSlice<number>([4.18938533204672725052e-01, 8.33333333333329678849e-02, -2.77777777728775536470e-03, 7.93650558643019558500e-04, -5.95187557450339963135e-04, 8.36339918996282139126e-04, -1.63092934096575273989e-03])

// Lgamma returns the natural logarithm and sign (-1 or +1) of [Gamma](x).
//
// Special cases are:
//
//	Lgamma(+Inf) = +Inf
//	Lgamma(0) = +Inf
//	Lgamma(-integer) = +Inf
//	Lgamma(-Inf) = -Inf
//	Lgamma(NaN) = NaN
export function Lgamma(x: number): [number, number] {
	let lgamma: number = 0;
	let sign: number = 1;

	// Constants
	const Ymin: number = 1.461632144968362245;
	const Two52: number = (1 << 52);
	const Two53: number = (1 << 53);
	const Two58: number = (1 << 58);
	const Tiny: number = 1.0 / ((1 << 70));
	const Tc: number = 1.46163214496836224576e+00;
	const Tf: number = -1.21486290535849611461e-01;
	const Tt: number = -3.63867699703950536541e-18;

	// special cases
	if (IsNaN(x)) {
		lgamma = x;
		return [lgamma, sign];
	}
	if (IsInf(x, 0)) {
		lgamma = x;
		return [lgamma, sign];
	}
	if (x == 0) {
		lgamma = Inf(1);
		return [lgamma, sign];
	}

	let neg = false;
	if (x < 0) {
		x = -x;
		neg = true;
	}

	// if |x| < 2**-70, return -log(|x|)
	if (x < 8.47033e-22) {
		if (neg) {
			sign = -1;
		}
		lgamma = -Log(x);
		return [lgamma, sign];
	}

	let nadj: number = 0;

	// Handle negative values
	if (neg) {
		// |x| >= 2**52, must be -integer
		if (x >= 4503599627370496) {
			lgamma = Inf(1);
			return [lgamma, sign];
		}
		let t = sinPi(x);

		// -integer
		if (t == 0) {
			lgamma = Inf(1);
			return [lgamma, sign];
		}
		nadj = Log(3.14159 / Abs(t * x));
		if (t < 0) {
			sign = -1;
		}
	}

	// Main computation
	if (x == 1 || x == 2) {
		lgamma = 0;
	} else if (x < 2) {
		let y: number = 0;
		let i: number = 0;
		
		if (x <= 0.9) {
			lgamma = -Log(x);
			
			if (x >= (1.46163 - 1 + 0.27)) {
				y = 1 - x;
				i = 0;
			} else if (x >= (1.46163 - 1 - 0.27)) {
				y = x - (1.46163 - 1);
				i = 1;
			} else {
				y = x;
				i = 2;
			}
		} else {
			lgamma = 0;
			
			if (x >= (1.46163 + 0.27)) {
				y = 2 - x;
				i = 0;
			} else if (x >= (1.46163 - 0.27)) {
				y = x - 1.46163;
				i = 1;
			} else {
				y = x - 1;
				i = 2;
			}
		}
		
		if (i === 0) {
			let z = y * y;
			let p1 = _lgamA![0] + z * (_lgamA![2] + z * (_lgamA![4] + z * (_lgamA![6] + z * (_lgamA![8] + z * _lgamA![10]))));
			let p2 = z * (_lgamA![1] + z * (+_lgamA![3] + z * (_lgamA![5] + z * (_lgamA![7] + z * (_lgamA![9] + z * _lgamA![11])))));
			let p = y * p1 + p2;
			lgamma += (p - 0.5 * y);
		} else if (i === 1) {
			let z = y * y;
			let w = z * y;
			let p1 = _lgamT![0] + w * (_lgamT![3] + w * (_lgamT![6] + w * (_lgamT![9] + w * _lgamT![12])));
			let p2 = _lgamT![1] + w * (_lgamT![4] + w * (_lgamT![7] + w * (_lgamT![10] + w * _lgamT![13])));
			let p3 = _lgamT![2] + w * (_lgamT![5] + w * (_lgamT![8] + w * (_lgamT![11] + w * _lgamT![14])));
			let p = z * p1 - (-3.63868e-18 - w * (p2 + y * p3));
			lgamma += (-0.121486 + p);
		} else { // i === 2
			let p1 = y * (_lgamU![0] + y * (_lgamU![1] + y * (_lgamU![2] + y * (_lgamU![3] + y * (_lgamU![4] + y * _lgamU![5])))));
			let p2 = 1 + y * (_lgamV![1] + y * (_lgamV![2] + y * (_lgamV![3] + y * (_lgamV![4] + y * _lgamV![5]))));
			lgamma += (-0.5 * y + p1 / p2);
		}
	} else if (x < 8) {
		let i = $.int(x);
		let y = x - (i as number);
		let p = y * (_lgamS![0] + y * (_lgamS![1] + y * (_lgamS![2] + y * (_lgamS![3] + y * (_lgamS![4] + y * (_lgamS![5] + y * _lgamS![6]))))));
		let q = 1 + y * (_lgamR![1] + y * (_lgamR![2] + y * (_lgamR![3] + y * (_lgamR![4] + y * (_lgamR![5] + y * _lgamR![6])))));
		lgamma = 0.5 * y + p / q;
		let z = 1.0;
		
		// Handle fallthrough cases properly
		if (i === 7) {
			z *= (y + 6);
			z *= (y + 5);
			z *= (y + 4);
			z *= (y + 3);
			z *= (y + 2);
			lgamma += Log(z);
		} else if (i === 6) {
			z *= (y + 5);
			z *= (y + 4);
			z *= (y + 3);
			z *= (y + 2);
			lgamma += Log(z);
		} else if (i === 5) {
			z *= (y + 4);
			z *= (y + 3);
			z *= (y + 2);
			lgamma += Log(z);
		} else if (i === 4) {
			z *= (y + 3);
			z *= (y + 2);
			lgamma += Log(z);
		} else if (i === 3) {
			z *= (y + 2);
			lgamma += Log(z);
		}
	} else if (x < 288230376151711744) {
		let t = Log(x);
		let z = 1 / x;
		let y = z * z;
		let w = _lgamW![0] + z * (_lgamW![1] + y * (_lgamW![2] + y * (_lgamW![3] + y * (_lgamW![4] + y * (_lgamW![5] + y * _lgamW![6])))));
		lgamma = (x - 0.5) * (t - 1) + w;
	} else {
		lgamma = x * (Log(x) - 1);
	}
	
	if (neg) {
		lgamma = nadj - lgamma;
	}
	
	return [lgamma, sign];
}

// sinPi(x) is a helper function for negative x
export function sinPi(x: number): number {
	const Two52: number = (1 << 52);
	const Two53: number = (1 << 53);
	
	if (x < 0.25) {
		return -Sin(3.14159 * x);
	}

	// argument reduction
	let z = Floor(x);
	let n: number = 0;

	if (z != x) {
		// inexact
		x = Mod(x, 2);
		n = $.int(x * 4);
	} else {
		// exact
		if (x >= 9007199254740992) {
			// x must be even
			x = 0;
			n = 0;
		} else {
			if (x < 4503599627370496) {
				z = x + 4503599627370496; // exact
			}
			n = $.int((1 & Float64bits(z)));
			x = (n as number);
			n <<= 2;
		}
	}
	
	if (n === 0) {
		x = Sin(3.14159 * x);
	} else if (n === 1 || n === 2) {
		x = Cos(3.14159 * (0.5 - x));
	} else if (n === 3 || n === 4) {
		x = Sin(3.14159 * (1 - x));
	} else if (n === 5 || n === 6) {
		x = -Cos(3.14159 * (x - 1.5));
	} else {
		x = Sin(3.14159 * (x - 2));
	}
	
	return -x;
}

