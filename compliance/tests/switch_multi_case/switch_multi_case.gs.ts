// Generated file based on switch_multi_case.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

export async function main(): Promise<void> {
	let stdNumMonth = 1

	// stdLongMonth := 3 // Not used in this specific example but good for context
	let stdZeroMonth = 2

	let month = 0
	let value = "someValue"
	let err: $.GoError = null

	let getnum = (v: string, flag: boolean): [number, string, $.GoError] => {
		if (flag) {
			return [12, v + "_processed_flag_true", null]
		}
		return [1, v + "_processed_flag_false", null]
	}

	let std = 2

	switch (std) {
		case stdNumMonth:
		case stdZeroMonth:
			;[month, value, err] = getnum!(value, std == stdZeroMonth)
			if (err != null) {
				console.log("Error:", err!.Error())
			}
			console.log("Month:", month, "Value:", value)
			break
		case 3:
			console.log("Std is 3")
			break
		default:
			console.log("Default case")
			break
	}

	std = 1
	switch (std) {
		case stdNumMonth:
		case stdZeroMonth:
			;[month, value, err] = getnum!(value, std == stdZeroMonth)
			if (err != null) {
				console.log("Error:", err!.Error())
			}
			console.log("Month:", month, "Value:", value)
			break
		case 3:
			console.log("Std is 3")
			break
		default:
			console.log("Default case")
			break
	}
}

