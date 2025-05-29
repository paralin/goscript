import * as $ from "@goscript/builtin/index.js";
import { IsNaN, NaN } from "./bits.gs.js";
import { Copysign } from "./copysign.gs.js";
import { Float32bits, Float32frombits, Float64bits, Float64frombits } from "./unsafe.gs.js";

// Nextafter32 returns the next representable float32 value after x towards y.
//
// Special cases are:
//
//	Nextafter32(x, x)   = x
//	Nextafter32(NaN, y) = NaN
//	Nextafter32(x, NaN) = NaN
export function Nextafter32(x: number, y: number): number {
	let r: number = 0
	{

		// special case
		switch (true) {
			case IsNaN((x as number)) || IsNaN((y as number)):
				r = (NaN() as number)
				break
			case x == y:
				r = x
				break
			case x == 0:
				r = (Copysign((Float32frombits(1) as number), (y as number)) as number)
				break
			case (y > x) == (x > 0):
				r = Float32frombits(Float32bits(x) + 1)
				break
			default:
				r = Float32frombits(Float32bits(x) - 1)
				break
		}
		return r
	}
}

// Nextafter returns the next representable float64 value after x towards y.
//
// Special cases are:
//
//	Nextafter(x, x)   = x
//	Nextafter(NaN, y) = NaN
//	Nextafter(x, NaN) = NaN
export function Nextafter(x: number, y: number): number {
	let r: number = 0
	{

		// special case
		switch (true) {
			case IsNaN(x) || IsNaN(y):
				r = NaN()
				break
			case x == y:
				r = x
				break
			case x == 0:
				r = Copysign(Float64frombits(1), y)
				break
			case (y > x) == (x > 0):
				r = Float64frombits(Float64bits(x) + 1)
				break
			default:
				r = Float64frombits(Float64bits(x) - 1)
				break
		}
		return r
	}
}

