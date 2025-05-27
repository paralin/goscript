// Generated file based on package_import_strconv.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as strconv from "@goscript/strconv/index.js"

export async function main(): Promise<void> {
	// Test Atoi
	let [i, err] = strconv.Atoi("42")
	if (err == null) {
		console.log("Atoi result:", i)
	}

	// Test Itoa
	let s = strconv.Itoa(123)
	console.log("Itoa result:", s)

	// Test ParseInt
	let i64: number
	[i64, err] = strconv.ParseInt("456", 10, 64)
	if (err == null) {
		console.log("ParseInt result:", i64)
	}

	// Test FormatInt
	let formatted = strconv.FormatInt(789, 10)
	console.log("FormatInt result:", formatted)

	// Test ParseFloat
	let f: number
	[f, err] = strconv.ParseFloat("3.14", 64)
	if (err == null) {
		console.log("ParseFloat result:", f)
	}

	// Test FormatFloat
	let floatStr = strconv.FormatFloat(2.718, 102, 3, 64)
	console.log("FormatFloat result:", floatStr)

	// Test ParseBool
	let b: boolean
	[b, err] = strconv.ParseBool("true")
	if (err == null) {
		console.log("ParseBool result:", b)
	}

	// Test FormatBool
	let boolStr = strconv.FormatBool(false)
	console.log("FormatBool result:", boolStr)

	// Test Quote
	let quoted = strconv.Quote("hello world")
	console.log("Quote result:", quoted)

	// Test Unquote
	let unquoted: string
	[unquoted, err] = strconv.Unquote(`"hello world"`)
	if (err == null) {
		console.log("Unquote result:", unquoted)
	}

	// Test error cases
	;[, err] = strconv.Atoi("invalid")
	if (err != null) {
		console.log("Atoi error handled")
	}

	;[, err] = strconv.ParseFloat("invalid", 64)
	if (err != null) {
		console.log("ParseFloat error handled")
	}

	console.log("test finished")
}

