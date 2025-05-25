// Generated file based on constants_iota.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export type ByteSize = number;

// ignore first value by assigning to blank identifier
let _: number = 0

export let KB: ByteSize = (1 << (10 * 0))

export let MB: ByteSize = 0

export let GB: ByteSize = 0

export let TB: ByteSize = 0

export type Direction = number;

export let North: Direction = 0

export let East: Direction = 0

export let South: Direction = 0

export let West: Direction = 0

export let Red: number = 0

export let Green: number = 0

export let Blue: number = 0

export let Sunday: number = 0

export let Monday: number = 0

export let Tuesday: number = 0

export let Wednesday: number = 0

export let Thursday: number = 0

export let Friday: number = 0

export let Saturday: number = 0

export let First: number = 0 + 1

export let Second: number = 0 + 1

export let Third: number = 0 + 1

export let A: number = 0 * 2

export let B: number = 0

export let C: number = 0

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

