import * as $ from "@goscript/builtin/index.js";
import { Abs } from "./abs.gs.js";
import { Inf, IsInf, IsNaN, NaN } from "./bits.gs.js";
import { J0, Y0 } from "./j0.gs.js";
import { J1, Y1 } from "./j1.gs.js";
import { Log } from "./log.gs.js";
import { Sincos } from "./sincos.gs.js";
import { Sqrt } from "./sqrt.gs.js";

// Jn returns the order-n Bessel function of the first kind.
//
// Special cases are:
//
//	Jn(n, ±Inf) = 0
//	Jn(n, NaN) = NaN
export function Jn(n: number, x: number): number {
	// special cases

	// J(-n, x) = (-1)**n * J(n, x), J(n, -x) = (-1)**n * J(n, x)
	// Thus, J(-n, x) = J(n, -x)
	switch (true) {
		case IsNaN(x):
			return x;
		case IsInf(x, 0):
			return 0;
	}

	if (n == 0) {
		return J0(x);
	}
	if (x == 0) {
		return 0;
	}
	if (n < 0) {
		[n, x] = [-n, -x];
	}
	if (n == 1) {
		return J1(x);
	}
	let sign = false;

	// odd n and negative x
	if (x < 0) {
		x = -x;

		// odd n and negative x
		if ((n & 1) == 1) {
			sign = true; // odd n and negative x
		}
	}
	let b: number = 0;

	// Safe to use J(n+1,x)=2n/x *J(n,x)-J(n-1,x)
	// x > 2**302

	// (x >> n**2)
	//          Jn(x) = cos(x-(2n+1)*pi/4)*sqrt(2/x*pi)
	//          Yn(x) = sin(x-(2n+1)*pi/4)*sqrt(2/x*pi)
	//          Let s=sin(x), c=cos(x),
	//              xn=x-(2n+1)*pi/4, sqt2 = sqrt(2),then
	//
	//                 n    sin(xn)*sqt2    cos(xn)*sqt2
	//              ----------------------------------
	//                 0     s-c             c+s
	//                 1    -s-c            -c+s
	//                 2    -s+c            -c-s
	//                 3     s+c             c-s

	// avoid underflow

	// x < 2**-29
	// x is tiny, return the first Taylor expansion of J(n,x)
	// J(n,x) = 1/n!*(x/2)**n  - ...

	// underflow

	// a = n!
	// b = (x/2)**n

	// use backward recurrence
	//                      x      x**2      x**2
	//  J(n,x)/J(n-1,x) =  ----   ------   ------   .....
	//                      2n  - 2(n+1) - 2(n+2)
	//
	//                      1      1        1
	//  (for large x)   =  ----  ------   ------   .....
	//                      2n   2(n+1)   2(n+2)
	//                      -- - ------ - ------ -
	//                       x     x         x
	//
	// Let w = 2n/x and h=2/x, then the above quotient
	// is equal to the continued fraction:
	//                  1
	//      = -----------------------
	//                     1
	//         w - -----------------
	//                        1
	//              w+h - ---------
	//                     w+2h - ...
	//
	// To determine how many terms needed, let
	// Q(0) = w, Q(1) = w(w+h) - 1,
	// Q(k) = (w+k*h)*Q(k-1) - Q(k-2),
	// When Q(k) > 1e4	good for single
	// When Q(k) > 1e9	good for double
	// When Q(k) > 1e17	good for quadruple

	// determine k

	//  estimate log((2/x)**n*n!) = n*log(2/x)+n*ln(n)
	//  Hence, if n*(log(2n/x)) > ...
	//  single 8.8722839355e+01
	//  double 7.09782712893383973096e+02
	//  long double 1.1356523406294143949491931077970765006170e+04
	//  then recurrent value may overflow and the result is
	//  likely underflow to zero

	// scale b to avoid spurious overflow
	if (n <= x) {
		// Safe to use J(n+1,x)=2n/x *J(n,x)-J(n-1,x)
		// x > 2**302

		// (x >> n**2)
		//          Jn(x) = cos(x-(2n+1)*pi/4)*sqrt(2/x*pi)
		//          Yn(x) = sin(x-(2n+1)*pi/4)*sqrt(2/x*pi)
		//          Let s=sin(x), c=cos(x),
		//              xn=x-(2n+1)*pi/4, sqt2 = sqrt(2),then
		//
		//                 n    sin(xn)*sqt2    cos(xn)*sqt2
		//              ----------------------------------
		//                 0     s-c             c+s
		//                 1    -s-c            -c+s
		//                 2    -s+c            -c-s
		//                 3     s+c             c-s

		// avoid underflow
		if (x >= 8148143905337944345073782753637512644205873574663745002544561797417525199053346824733589504) {
			// x > 2**302

			// (x >> n**2)
			//          Jn(x) = cos(x-(2n+1)*pi/4)*sqrt(2/x*pi)
			//          Yn(x) = sin(x-(2n+1)*pi/4)*sqrt(2/x*pi)
			//          Let s=sin(x), c=cos(x),
			//              xn=x-(2n+1)*pi/4, sqt2 = sqrt(2),then
			//
			//                 n    sin(xn)*sqt2    cos(xn)*sqt2
			//              ----------------------------------
			//                 0     s-c             c+s
			//                 1    -s-c            -c+s
			//                 2    -s+c            -c-s
			//                 3     s+c             c-s

			let temp: number = 0;
			const [s, c] = Sincos(x);
			switch ((n & 3)) {
				case 0:
					temp = c + s;
					break;
				case 1:
					temp = -c + s;
					break;
				case 2:
					temp = -c - s;
					break;
				case 3:
					temp = c - s;
					break;
			}
			b = (1 / 1.77245) * temp / Sqrt(x);
		} else {
			b = J1(x);

			// avoid underflow
			for (let i = 1, a = J0(x); i < n; i++) {
				[a, b] = [b, b * ((i + i) / x) - a]; // avoid underflow
			}
		}
	} else {
		// x < 2**-29
		// x is tiny, return the first Taylor expansion of J(n,x)
		// J(n,x) = 1/n!*(x/2)**n  - ...

		// underflow

		// a = n!
		// b = (x/2)**n

		// use backward recurrence
		//                      x      x**2      x**2
		//  J(n,x)/J(n-1,x) =  ----   ------   ------   .....
		//                      2n  - 2(n+1) - 2(n+2)
		//
		//                      1      1        1
		//  (for large x)   =  ----  ------   ------   .....
		//                      2n   2(n+1)   2(n+2)
		//                      -- - ------ - ------ -
		//                       x     x         x
		//
		// Let w = 2n/x and h=2/x, then the above quotient
		// is equal to the continued fraction:
		//                  1
		//      = -----------------------
		//                     1
		//         w - -----------------
		//                        1
		//              w+h - ---------
		//                     w+2h - ...
		//
		// To determine how many terms needed, let
		// Q(0) = w, Q(1) = w(w+h) - 1,
		// Q(k) = (w+k*h)*Q(k-1) - Q(k-2),
		// When Q(k) > 1e4	good for single
		// When Q(k) > 1e9	good for double
		// When Q(k) > 1e17	good for quadruple

		// determine k

		//  estimate log((2/x)**n*n!) = n*log(2/x)+n*ln(n)
		//  Hence, if n*(log(2n/x)) > ...
		//  single 8.8722839355e+01
		//  double 7.09782712893383973096e+02
		//  long double 1.1356523406294143949491931077970765006170e+04
		//  then recurrent value may overflow and the result is
		//  likely underflow to zero

		// scale b to avoid spurious overflow
		if (x < 1.86265e-09) {
			// x < 2**-29
			// x is tiny, return the first Taylor expansion of J(n,x)
			// J(n,x) = 1/n!*(x/2)**n  - ...

			// underflow

			// a = n!
			// b = (x/2)**n
			if (n > 33) {
				// underflow
				b = 0;
			} else {
				let temp = x * 0.5;
				b = temp;
				let a = 1.0;

				// a = n!
				// b = (x/2)**n
				for (let i = 2; i <= n; i++) {
					a *= i; // a = n!
					b *= temp; // b = (x/2)**n
				}
				b /= a;
			}
		} else {
			// use backward recurrence
			//                      x      x**2      x**2
			//  J(n,x)/J(n-1,x) =  ----   ------   ------   .....
			//                      2n  - 2(n+1) - 2(n+2)
			//
			//                      1      1        1
			//  (for large x)   =  ----  ------   ------   .....
			//                      2n   2(n+1)   2(n+2)
			//                      -- - ------ - ------ -
			//                       x     x         x
			//
			// Let w = 2n/x and h=2/x, then the above quotient
			// is equal to the continued fraction:
			//                  1
			//      = -----------------------
			//                     1
			//         w - -----------------
			//                        1
			//              w+h - ---------
			//                     w+2h - ...
			//
			// To determine how many terms needed, let
			// Q(0) = w, Q(1) = w(w+h) - 1,
			// Q(k) = (w+k*h)*Q(k-1) - Q(k-2),
			// When Q(k) > 1e4	good for single
			// When Q(k) > 1e9	good for double
			// When Q(k) > 1e17	good for quadruple

			// determine k
			let w = (n + n) / x;
			let h = 2 / x;
			let q0 = w;
			let z = w + h;
			let q1 = w * z - 1;
			let k = 1;
			for (; q1 < 1e9; ) {
				k++;
				z += h;
				[q0, q1] = [q1, z * q1 - q0];
			}
			let m = n + n;
			let t = 0.0;
			for (let i = 2 * (n + k); i >= m; i -= 2) {
				t = 1 / (i / x - t);
			}
			let a = t;

			//  estimate log((2/x)**n*n!) = n*log(2/x)+n*ln(n)
			//  Hence, if n*(log(2n/x)) > ...
			//  single 8.8722839355e+01
			//  double 7.09782712893383973096e+02
			//  long double 1.1356523406294143949491931077970765006170e+04
			//  then recurrent value may overflow and the result is
			//  likely underflow to zero
			b = 1;

			let tmp = n;
			let v = 2 / x;
			tmp = tmp * Log(Abs(v * tmp));

			// scale b to avoid spurious overflow
			if (tmp < 7.09782712893383973096e+02) {
				for (let i = n - 1; i > 0; i--) {
					let di = (i + i);
					[a, b] = [b, b * di / x - a];
				}
			} else {

				// scale b to avoid spurious overflow
				for (let i = n - 1; i > 0; i--) {
					let di = (i + i);
					[a, b] = [b, b * di / x - a];
					// scale b to avoid spurious overflow
					if (b > 1e100) {
						a /= b;
						t /= b;
						b = 1;
					}
				}
			}
			b = t * J0(x) / b;
		}
	}
	if (sign) {
		return -b;
	}
	return b;
}

// Yn returns the order-n Bessel function of the second kind.
//
// Special cases are:
//
//	Yn(n, +Inf) = 0
//	Yn(n ≥ 0, 0) = -Inf
//	Yn(n < 0, 0) = +Inf if n is odd, -Inf if n is even
//	Yn(n, x < 0) = NaN
//	Yn(n, NaN) = NaN
export function Yn(n: number, x: number): number {
	// special cases
	switch (true) {
		case x < 0 || IsNaN(x):
			return NaN();
		case IsInf(x, 1):
			return 0;
	}

	if (n == 0) {
		return Y0(x);
	}
	if (x == 0) {
		if (n < 0 && (n & 1) == 1) {
			return Inf(1);
		}
		return Inf(-1);
	}
	let sign = false;

	// sign true if n < 0 && |n| odd
	if (n < 0) {
		n = -n;

		// sign true if n < 0 && |n| odd
		if ((n & 1) == 1) {
			sign = true; // sign true if n < 0 && |n| odd
		}
	}
	if (n == 1) {
		if (sign) {
			return -Y1(x);
		}
		return Y1(x);
	}
	let b: number = 0;
	// x > 2**302
	// (x >> n**2)
	//	    Jn(x) = cos(x-(2n+1)*pi/4)*sqrt(2/x*pi)
	//	    Yn(x) = sin(x-(2n+1)*pi/4)*sqrt(2/x*pi)
	//	    Let s=sin(x), c=cos(x),
	//		xn=x-(2n+1)*pi/4, sqt2 = sqrt(2),then
	//
	//		   n	sin(xn)*sqt2	cos(xn)*sqt2
	//		----------------------------------
	//		   0	 s-c		 c+s
	//		   1	-s-c 		-c+s
	//		   2	-s+c		-c-s
	//		   3	 s+c		 c-s

	// quit if b is -inf
	if (x >= 8148143905337944345073782753637512644205873574663745002544561797417525199053346824733589504) {
		// x > 2**302
		// (x >> n**2)
		//	    Jn(x) = cos(x-(2n+1)*pi/4)*sqrt(2/x*pi)
		//	    Yn(x) = sin(x-(2n+1)*pi/4)*sqrt(2/x*pi)
		//	    Let s=sin(x), c=cos(x),
		//		xn=x-(2n+1)*pi/4, sqt2 = sqrt(2),then
		//
		//		   n	sin(xn)*sqt2	cos(xn)*sqt2
		//		----------------------------------
		//		   0	 s-c		 c+s
		//		   1	-s-c 		-c+s
		//		   2	-s+c		-c-s
		//		   3	 s+c		 c-s

		let temp: number = 0;
		const [s, c] = Sincos(x);
		switch ((n & 3)) {
			case 0:
				temp = s - c;
				break;
			case 1:
				temp = -s - c;
				break;
			case 2:
				temp = -s + c;
				break;
			case 3:
				temp = s + c;
				break;
		}
		b = (1 / 1.77245) * temp / Sqrt(x);
	} else {
		let a = Y0(x);
		b = Y1(x);
		// quit if b is -inf
		for (let i = 1; i < n && !IsInf(b, -1); i++) {
			[a, b] = [b, ((i + i) / x) * b - a];
		}
	}
	if (sign) {
		return -b;
	}
	return b;
}

