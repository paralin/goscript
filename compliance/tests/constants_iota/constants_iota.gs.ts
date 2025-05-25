// Generated file based on constants_iota.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

type ByteSize = number;

// ignore first value by assigning to blank identifier
let _: number = 0

let KB: ByteSize = (1 << (10 * 0))

let MB: ByteSize = 0

let GB: ByteSize = 0

let TB: ByteSize = 0

type Direction = number;

let North: Direction = 0

let East: Direction = 0

let South: Direction = 0

let West: Direction = 0

let Red: number = 0

let Green: number = 0

let Blue: number = 0

let Sunday: number = 0

let Monday: number = 0

let Tuesday: number = 0

let Wednesday: number = 0

let Thursday: number = 0

let Friday: number = 0

let Saturday: number = 0

let First: number = 0 + 1

let Second: number = 0 + 1

let Third: number = 0 + 1

let A: number = 0 * 2

let B: number = 0

let C: number = 0

export async function main(): Promise<void> {
	console.log("ByteSize constants:")
	console.log("KB:", (1024 as number))
	console.log("MB:", (1048576 as number))
	console.log("GB:", (1073741824 as number))
	console.log("TB:", (1099511627776 as number))

	console.log("Direction constants:")
	console.log("North:", (0 as number))
	console.log("East:", (1 as number))
	console.log("South:", (2 as number))
	console.log("West:", (3 as number))

	console.log("Color constants:")
	console.log("Red:", 0)
	console.log("Green:", 1)
	console.log("Blue:", 2)

	console.log("Day constants:")
	console.log("Sunday:", 0)
	console.log("Monday:", 1)
	console.log("Tuesday:", 2)
	console.log("Wednesday:", 3)
	console.log("Thursday:", 4)
	console.log("Friday:", 5)
	console.log("Saturday:", 6)

	console.log("Arithmetic constants:")
	console.log("First:", 1)
	console.log("Second:", 2)
	console.log("Third:", 3)

	console.log("Multiplication constants:")
	console.log("A:", 0)
	console.log("B:", 2)
	console.log("C:", 4)
}

