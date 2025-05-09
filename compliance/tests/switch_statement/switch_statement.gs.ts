// Generated file based on switch_statement.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

export function main(): void {
	let i = 2
	$.println("Integer switch:")
	switch (i) {
		case 1:
			$.println("one")
			break
		case 2:
			$.println("two")
			break
		case 3:
			$.println("three")
			break
		default:
			$.println("other integer")
			break
	}

	let s = "hello"
	$.println("\nString switch:")
	switch (s) {
		case "world":
			$.println("world")
			break
		case "hello":
			$.println("hello")
			break
		default:
			$.println("other string")
			break
	}
	let x = -5
	$.println("\nSwitch without expression:")

	// x > 0
	switch (true) {
		case x < 0:
			$.println("negative")
			break
		case x == 0:
			$.println("zero")
			break
		default:
			$.println("positive")
			break
	}

	x = 0
	$.println("\nSwitch without expression (zero):")

	// x > 0
	switch (true) {
		case x < 0:
			$.println("negative")
			break
		case x == 0:
			$.println("zero")
			break
		default:
			$.println("positive")
			break
	}

	x = 10
	$.println("\nSwitch without expression (positive):")

	// x > 0
	switch (true) {
		case x < 0:
			$.println("negative")
			break
		case x == 0:
			$.println("zero")
			break
		default:
			$.println("positive")
			break
	}
}

