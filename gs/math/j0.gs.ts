import * as $ from "@goscript/builtin/builtin.js";
import { Abs } from "./abs.gs.js";
import { Inf, IsInf, IsNaN, NaN } from "./bits.gs.js";
import { Log } from "./log.gs.js";
import { Cos } from "./sin.gs.js";
import { Sincos } from "./sincos.gs.js";
import { Sqrt } from "./sqrt.gs.js";

// J0 returns the order-zero Bessel function of the first kind.
//
// Special cases are:
//
//	J0(±Inf) = 0
//	J0(0) = 1
//	J0(NaN) = NaN
export function J0(x: number): number {
	// Constants
	const TwoM27: number = 1.0 / (1 << 27); // 2**-27
	const TwoM13: number = 1.0 / (1 << 13); // 2**-13
	const Two129: number = Math.pow(2, 129); // 2**129
	
	// R0/S0 coefficients on [0, 2]
	const R02: number = 1.56249999999999947958e-02;
	const R03: number = -1.89979294238854721751e-04;
	const R04: number = 1.82954049532700665670e-06;
	const R05: number = -4.61832688532103189199e-09;
	const S01: number = 1.56191029464890010492e-02;
	const S02: number = 1.16926784663337450260e-04;
	const S03: number = 5.13546550207318111446e-07;
	const S04: number = 1.16614003333790000205e-09;
	
	// special cases
	if (IsNaN(x)) {
		return x;
	}
	if (IsInf(x, 0)) {
		return 0;
	}
	if (x == 0) {
		return 1;
	}

	x = Abs(x);

	// |x| >= 2.0
	if (x >= 2) {
		const [s, c] = Sincos(x);
		let ss = s - c;
		let cc = s + c;

		// make sure x+x does not overflow
		if (x < 1.79769e+308 / 2) {
			const z = -Cos(x + x);
			if (s * c < 0) {
				cc = z / ss;
			} else {
				ss = z / cc;
			}
		}

		let z: number;
		// |x| > ~6.8056e+38
		if (x > 680564733841876926926749214863536422912) {
			z = (1 / 1.77245) * cc / Sqrt(x);
		} else {
			const u = pzero(x);
			const v = qzero(x);
			z = (1 / 1.77245) * (u * cc - v * ss) / Sqrt(x);
		}
		return z;
	}
	
	// |x| < ~1.2207e-4
	if (x < 0.00012207) {
		// |x| < ~7.4506e-9
		if (x < 7.45058e-09) {
			return 1;
		}
		return 1 - 0.25 * x * x;
	}
	
	const z = x * x;
	const r = z * (R02 + z * (R03 + z * (R04 + z * R05)));
	const s = 1 + z * (S01 + z * (S02 + z * (S03 + z * S04)));

	// |x| < 1.00
	if (x < 1) {
		return 1 + z * (-0.25 + (r / s));
	}
	const u = 0.5 * x;
	return (1 + u) * (1 - u) + z * (r / s);
}

// Y0 returns the order-zero Bessel function of the second kind.
//
// Special cases are:
//
//	Y0(+Inf) = 0
//	Y0(0) = -Inf
//	Y0(x < 0) = NaN
//	Y0(NaN) = NaN
export function Y0(x: number): number {
	// Constants
	const TwoM27: number = 1.0 / (1 << 27); // 2**-27
	const Two129: number = Math.pow(2, 129); // 2**129
	
	// U coefficients
	const U00: number = -7.38042951086872317523e-02;
	const U01: number = 1.76666452509181115538e-01;
	const U02: number = -1.38185671945596898896e-02;
	const U03: number = 3.47453432093683650238e-04;
	const U04: number = -3.81407053724364161125e-06;
	const U05: number = 1.95590137035022920206e-08;
	const U06: number = -3.98205194132103398453e-11;
	
	// V coefficients
	const V01: number = 1.27304834834123699328e-02;
	const V02: number = 7.60068627350353253702e-05;
	const V03: number = 2.59150851840457805467e-07;
	const V04: number = 4.41110311332675467403e-10;
	
	// special cases
	if (x < 0 || IsNaN(x)) {
		return NaN();
	}
	if (IsInf(x, 1)) {
		return 0;
	}
	if (x == 0) {
		return Inf(-1);
	}

	// |x| >= 2.0
	if (x >= 2) {
		const [s, c] = Sincos(x);
		let ss = s - c;
		let cc = s + c;

		// make sure x+x does not overflow
		if (x < 1.79769e+308 / 2) {
			const z = -Cos(x + x);
			if (s * c < 0) {
				cc = z / ss;
			} else {
				ss = z / cc;
			}
		}
		
		let z: number;
		// |x| > ~6.8056e+38
		if (x > 680564733841876926926749214863536422912) {
			z = (1 / 1.77245) * ss / Sqrt(x);
		} else {
			const u = pzero(x);
			const v = qzero(x);
			z = (1 / 1.77245) * (u * ss + v * cc) / Sqrt(x);
		}
		return z;
	}

	// |x| < ~7.4506e-9
	if (x <= 7.45058e-09) {
		return U00 + (2 / Math.PI) * Log(x);
	}
	
	const z = x * x;
	const u = U00 + z * (U01 + z * (U02 + z * (U03 + z * (U04 + z * (U05 + z * U06)))));
	const v = 1 + z * (V01 + z * (V02 + z * (V03 + z * V04)));
	return u / v + (2 / Math.PI) * J0(x) * Log(x);
}

const p0R8: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([0.00000000000000000000e+00, -7.03124999999900357484e-02, -8.08167041275349795626e+00, -2.57063105679704847262e+02, -2.48521641009428822144e+03, -5.25304380490729545272e+03]));

const p0S8: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([1.16534364619668181717e+02, 3.83374475364121826715e+03, 4.05978572648472545552e+04, 1.16752972564375915681e+05, 4.76277284146730962675e+04]));

const p0R5: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([-1.14125464691894502584e-11, -7.03124940873599280078e-02, -4.15961064470587782438e+00, -6.76747652265167261021e+01, -3.31231299649172967747e+02, -3.46433388365604912451e+02]));

const p0S5: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([6.07539382692300335975e+01, 1.05125230595704579173e+03, 5.97897094333855784498e+03, 9.62544514357774460223e+03, 2.40605815922939109441e+03]));

const p0R3: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([-2.54704601771951915620e-09, -7.03119616381481654654e-02, -2.40903221549529611423e+00, -2.19659774734883086467e+01, -5.80791704701737572236e+01, -3.14479470594888503854e+01]));

const p0S3: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([3.58560338055209726349e+01, 3.61513983050303863820e+02, 1.19360783792111533330e+03, 1.12799679856907414432e+03, 1.73580930813335754692e+02]));

const p0R2: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([-8.87534333032526411254e-08, -7.03030995483624743247e-02, -1.45073846780952986357e+00, -7.63569613823527770791e+00, -1.11931668860356747786e+01, -3.23364579351335335033e+00]));

const p0S2: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([2.22202997532088808441e+01, 1.36206794218215208048e+02, 2.70470278658083486789e+02, 1.53875394208320329881e+02, 1.46576176948256193810e+01]));

export function pzero(x: number): number {
	let p: $.VarRef<$.Slice<number>>;
	let q: $.VarRef<$.Slice<number>>;
	
	if (x >= 8) {
		p = p0R8;
		q = p0S8;
	} else if (x >= 4.5454) {
		p = p0R5;
		q = p0S5;
	} else if (x >= 2.8571) {
		p = p0R3;
		q = p0S3;
	} else if (x >= 2) {
		p = p0R2;
		q = p0S2;
	} else {
		// This should not happen based on the calling code, but we need to handle it
		throw new Error("pzero: x must be >= 2");
	}
	
	const z = 1 / (x * x);
	const r = p.value![0] + z * (p.value![1] + z * (p.value![2] + z * (p.value![3] + z * (p.value![4] + z * p.value![5]))));
	const s = 1 + z * (q.value![0] + z * (q.value![1] + z * (q.value![2] + z * (q.value![3] + z * q.value![4]))));
	return 1 + r / s;
}

const q0R8: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([0.00000000000000000000e+00, 7.32421874999935051953e-02, 1.17682064682252693899e+01, 5.57673380256401856059e+02, 8.85919720756468632317e+03, 3.70146267776887834771e+04]));

const q0S8: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([1.63776026895689824414e+02, 8.09834494656449805916e+03, 1.42538291419120476348e+05, 8.03309257119514397345e+05, 8.40501579819060512818e+05, -3.43899293537866615225e+05]));

const q0R5: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([1.84085963594515531381e-11, 7.32421766612684765896e-02, 5.83563508962056953777e+00, 1.35111577286449829671e+02, 1.02724376596164097464e+03, 1.98997785864605384631e+03]));

const q0S5: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([8.27766102236537761883e+01, 2.07781416421392987104e+03, 1.88472887785718085070e+04, 5.67511122894947329769e+04, 3.59767538425114471465e+04, -5.35434275601944773371e+03]));

const q0R3: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([4.37741014089738620906e-09, 7.32411180042911447163e-02, 3.34423137516170720929e+00, 4.26218440745412650017e+01, 1.70808091340565596283e+02, 1.66733948696651168575e+02]));

const q0S3: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([4.87588729724587182091e+01, 7.09689221056606015736e+02, 3.70414822620111362994e+03, 6.46042516752568917582e+03, 2.51633368920368957333e+03, -1.49247451836156386662e+02]));

const q0R2: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([1.50444444886983272379e-07, 7.32234265963079278272e-02, 1.99819174093815998816e+00, 1.44956029347885735348e+01, 3.16662317504781540833e+01, 1.62527075710929267416e+01]));

const q0S2: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([3.03655848355219184498e+01, 2.69348118608049844624e+02, 8.44783757595320139444e+02, 8.82935845112488550512e+02, 2.12666388511798828631e+02, -5.31095493882666946917e+00]));

export function qzero(x: number): number {
	let p: $.VarRef<$.Slice<number>>;
	let q: $.VarRef<$.Slice<number>>;
	
	if (x >= 8) {
		p = q0R8;
		q = q0S8;
	} else if (x >= 4.5454) {
		p = q0R5;
		q = q0S5;
	} else if (x >= 2.8571) {
		p = q0R3;
		q = q0S3;
	} else if (x >= 2) {
		p = q0R2;
		q = q0S2;
	} else {
		// This should not happen based on the calling code, but we need to handle it
		throw new Error("qzero: x must be >= 2");
	}
	
	const z = 1 / (x * x);
	const r = p.value![0] + z * (p.value![1] + z * (p.value![2] + z * (p.value![3] + z * (p.value![4] + z * p.value![5]))));
	const s = 1 + z * (q.value![0] + z * (q.value![1] + z * (q.value![2] + z * (q.value![3] + z * (q.value![4] + z * q.value![5])))));
	return (-0.125 + r / s) / x;
}

