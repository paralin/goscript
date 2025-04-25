// Generated file based on switch_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as goscript from "@go/builtin";

export async function main(): Promise<void> {
	let i = 2
	console.log("Integer switch:")
	switch (i) {
	case 1:
		console.log("one")
		break
	case 2:
		console.log("two")
		break
	case 3:
		console.log("three")
		break
	default:
		console.log("other integer")
		break
	}

	let s = "hello"
	console.log("\nString switch:")
	switch (s) {
	case "world":
		console.log("world")
		break
	case "hello":
		console.log("hello")
		break
	default:
		console.log("other string")
		break
	}
	let x = -5
	console.log("\nSwitch without expression:")
	switch (true) {
	case x < 0:
		console.log("negative")
		break
	case x == 0:
		console.log("zero")
		break
	default: // x > 0
		console.log("positive")
		break
	}

	x = 0
	console.log("\nSwitch without expression (zero):")
	switch (true) {
	case x < 0:
		console.log("negative")
		break
	case x == 0:
		console.log("zero")
		break
	default: // x > 0
		console.log("positive")
		break
	}

	x = 10
	console.log("\nSwitch without expression (positive):")
	switch (true) {
	case x < 0:
		console.log("negative")
		break
	case x == 0:
		console.log("zero")
		break
	default: // x > 0
		console.log("positive")
		break
	}
}
