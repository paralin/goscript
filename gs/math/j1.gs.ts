import * as $ from "@goscript/builtin/builtin.js";
import { Inf, IsInf, IsNaN, NaN } from "./bits.gs.js";
import { Log } from "./log.gs.js";
import { Cos } from "./sin.gs.js";
import { Sincos } from "./sincos.gs.js";
import { Sqrt } from "./sqrt.gs.js";

// J1 returns the order-one Bessel function of the first kind.
//
// Special cases are:
//
//	J1(±Inf) = 0
//	J1(NaN) = NaN
export function J1(x: number): number {
	// special cases
	switch (true) {
		case IsNaN(x):
			return x;
		case IsInf(x, 0) || x == 0:
			return 0;
	}

	let sign = false;
	if (x < 0) {
		x = -x;
		sign = true;
	}

	// j1(x) = 1/sqrt(pi) * (P(1,x)*cc - Q(1,x)*ss) / sqrt(x)
	// y1(x) = 1/sqrt(pi) * (P(1,x)*ss + Q(1,x)*cc) / sqrt(x)
	if (x >= 2) {
		let [s, c] = Sincos(x);
		let ss = -s - c;
		let cc = s - c;

		// make sure x+x does not overflow
		if (x < 1.79769e+308 / 2) {
			let z = Cos(x + x);
			if (s * c > 0) {
				cc = z / ss;
			} else {
				ss = z / cc;
			}
		}

		// j1(x) = 1/sqrt(pi) * (P(1,x)*cc - Q(1,x)*ss) / sqrt(x)
		// y1(x) = 1/sqrt(pi) * (P(1,x)*ss + Q(1,x)*cc) / sqrt(x)

		let z: number = 0;
		if (x > 680564733841876926926749214863536422912) {
			z = (1 / 1.77245) * cc / Sqrt(x);
		} else {
			let u = pone(x);
			let v = qone(x);
			z = (1 / 1.77245) * (u * cc - v * ss) / Sqrt(x);
		}
		if (sign) {
			return -z;
		}
		return z;
	}
	// |x|<2**-27
	// inexact if x!=0 necessary
	if (x < 7.45058e-09) {
		// |x|<2**-27
		return 0.5 * x;
	}
	let z = x * x;
	let r = z * (-0.0625 + z * (0.00140706 + z * (-1.59956e-05 + z * 4.96728e-08)));
	let s = 1.0 + z * (0.0191538 + z * (0.000185947 + z * (1.17718e-06 + z * (5.04636e-09 + z * 1.23542e-11))));
	r *= x;
	z = 0.5 * x + r / s;
	if (sign) {
		return -z;
	}
	return z;
}

// Y1 returns the order-one Bessel function of the second kind.
//
// Special cases are:
//
//	Y1(+Inf) = 0
//	Y1(0) = -Inf
//	Y1(x < 0) = NaN
//	Y1(NaN) = NaN
export function Y1(x: number): number {
	// special cases
	switch (true) {
		case x < 0 || IsNaN(x):
			return NaN();
		case IsInf(x, 1):
			return 0;
		case x == 0:
			return Inf(-1);
	}

	// y1(x) = sqrt(2/(pi*x))*(p1(x)*sin(x0)+q1(x)*cos(x0))
	// where x0 = x-3pi/4
	//     Better formula:
	//         cos(x0) = cos(x)cos(3pi/4)+sin(x)sin(3pi/4)
	//                 =  1/sqrt(2) * (sin(x) - cos(x))
	//         sin(x0) = sin(x)cos(3pi/4)-cos(x)sin(3pi/4)
	//                 = -1/sqrt(2) * (cos(x) + sin(x))
	// To avoid cancellation, use
	//     sin(x) +- cos(x) = -cos(2x)/(sin(x) -+ cos(x))
	// to compute the worse one.
	if (x >= 2) {
		let [s, c] = Sincos(x);
		let ss = -s - c;
		let cc = s - c;

		// make sure x+x does not overflow
		if (x < 1.79769e+308 / 2) {
			let z = Cos(x + x);
			if (s * c > 0) {
				cc = z / ss;
			} else {
				ss = z / cc;
			}
		}

		let z: number = 0;
		if (x > 680564733841876926926749214863536422912) {
			z = (1 / 1.77245) * ss / Sqrt(x);
		} else {
			let u = pone(x);
			let v = qone(x);
			z = (1 / 1.77245) * (u * ss + v * cc) / Sqrt(x);
		}
		return z;
	}
	// x < 2**-54
	if (x <= 5.55112e-17) {
		// x < 2**-54
		return -(2 / 3.14159) / x;
	}
	let z = x * x;
	let u = -0.196057 + z * (0.0504439 + z * (-0.00191257 + z * (2.35253e-05 + z * -9.19099e-08)));
	let v = 1 + z * (0.0199167 + z * (0.000202553 + z * (1.35609e-06 + z * (6.22741e-09 + z * 1.66559e-11))));
	return x * (u / v) + (2 / 3.14159) * (J1(x) * Log(x) - 1 / x);
}

let p1R8: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([0.00000000000000000000e+00, 1.17187499999988647970e-01, 1.32394806593073575129e+01, 4.12051854307378562225e+02, 3.87474538913960532227e+03, 7.91447954031891731574e+03]));

let p1S8: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([1.14207370375678408436e+02, 3.65093083420853463394e+03, 3.69562060269033463555e+04, 9.76027935934950801311e+04, 3.08042720627888811578e+04]));

let p1R5: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([1.31990519556243522749e-11, 1.17187493190614097638e-01, 6.80275127868432871736e+00, 1.08308182990189109773e+02, 5.17636139533199752805e+02, 5.28715201363337541807e+02]));

let p1S5: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([5.92805987221131331921e+01, 9.91401418733614377743e+02, 5.35326695291487976647e+03, 7.84469031749551231769e+03, 1.50404688810361062679e+03]));

let p1R3: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([3.02503916137373618024e-09, 1.17186865567253592491e-01, 3.93297750033315640650e+00, 3.51194035591636932736e+01, 9.10550110750781271918e+01, 4.85590685197364919645e+01]));

let p1S3: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([3.47913095001251519989e+01, 3.36762458747825746741e+02, 1.04687139975775130551e+03, 8.90811346398256432622e+02, 1.03787932439639277504e+02]));

let p1R2: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([1.07710830106873743082e-07, 1.17176219462683348094e-01, 2.36851496667608785174e+00, 1.22426109148261232917e+01, 1.76939711271687727390e+01, 5.07352312588818499250e+00]));

let p1S2: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([2.14364859363821409488e+01, 1.25290227168402751090e+02, 2.32276469057162813669e+02, 1.17679373287147100768e+02, 8.36463893371618283368e+00]));

export function pone(x: number): number {
	let p: $.VarRef<$.Slice<number>>;
	let q: $.VarRef<$.Slice<number>>;
	
	if (x >= 8) {
		p = p1R8;
		q = p1S8;
	} else if (x >= 4.5454) {
		p = p1R5;
		q = p1S5;
	} else if (x >= 2.8571) {
		p = p1R3;
		q = p1S3;
	} else if (x >= 2) {
		p = p1R2;
		q = p1S2;
	} else {
		// Default case to ensure p and q are always assigned
		p = p1R2;
		q = p1S2;
	}
	
	let z = 1 / (x * x);
	let r = p.value![0] + z * (p.value![1] + z * (p.value![2] + z * (p.value![3] + z * (p.value![4] + z * p.value![5]))));
	let s = 1.0 + z * (q.value![0] + z * (q.value![1] + z * (q.value![2] + z * (q.value![3] + z * q.value![4]))));
	return 1 + r / s;
}

let q1R8: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([0.00000000000000000000e+00, -1.02539062499992714161e-01, -1.62717534544589987888e+01, -7.59601722513950107896e+02, -1.18498066702429587167e+04, -4.84385124285750353010e+04]));

let q1S8: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([1.61395369700722909556e+02, 7.82538599923348465381e+03, 1.33875336287249578163e+05, 7.19657723683240939863e+05, 6.66601232617776375264e+05, -2.94490264303834643215e+05]));

let q1R5: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([-2.08979931141764104297e-11, -1.02539050241375426231e-01, -8.05644828123936029840e+00, -1.83669607474888380239e+02, -1.37319376065508163265e+03, -2.61244440453215656817e+03]));

let q1S5: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([8.12765501384335777857e+01, 1.99179873460485964642e+03, 1.74684851924908907677e+04, 4.98514270910352279316e+04, 2.79480751638918118260e+04, -4.71918354795128470869e+03]));

let q1R3: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([-5.07831226461766561369e-09, -1.02537829820837089745e-01, -4.61011581139473403113e+00, -5.78472216562783643212e+01, -2.28244540737631695038e+02, -2.19210128478909325622e+02]));

let q1S3: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([4.76651550323729509273e+01, 6.73865112676699709482e+02, 3.38015286679526343505e+03, 5.54772909720722782367e+03, 1.90311919338810798763e+03, -1.35201191444307340817e+02]));

let q1R2: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([-1.78381727510958865572e-07, -1.02517042607985553460e-01, -2.75220568278187460720e+00, -1.96636162643703720221e+01, -4.23253133372830490089e+01, -2.13719211703704061733e+01]));

let q1S2: $.VarRef<$.Slice<number>> = $.varRef($.arrayToSlice<number>([2.95333629060523854548e+01, 2.52981549982190529136e+02, 7.57502834868645436472e+02, 7.39393205320467245656e+02, 1.55949003336666123687e+02, -4.95949898822628210127e+00]));

export function qone(x: number): number {
	let p: $.VarRef<$.Slice<number>>;
	let q: $.VarRef<$.Slice<number>>;
	
	if (x >= 8) {
		p = q1R8;
		q = q1S8;
	} else if (x >= 4.5454) {
		p = q1R5;
		q = q1S5;
	} else if (x >= 2.8571) {
		p = q1R3;
		q = q1S3;
	} else if (x >= 2) {
		p = q1R2;
		q = q1S2;
	} else {
		// Default case to ensure p and q are always assigned
		p = q1R2;
		q = q1S2;
	}
	
	let z = 1 / (x * x);
	let r = p.value![0] + z * (p.value![1] + z * (p.value![2] + z * (p.value![3] + z * (p.value![4] + z * p.value![5]))));
	let s = 1 + z * (q.value![0] + z * (q.value![1] + z * (q.value![2] + z * (q.value![3] + z * (q.value![4] + z * q.value![5])))));
	return (0.375 + r / s) / x;
}

