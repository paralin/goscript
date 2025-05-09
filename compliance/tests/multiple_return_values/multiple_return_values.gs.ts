// Generated file based on multiple_return_values.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

function multipleReturnValues(): [number, string, boolean] {
	return [42, "hello", true]
}

export function main(): void {
	let [a, b, c] = (multipleReturnValues)()
	$.println(a)
	$.println(b)
	$.println(c)

	let [x, , z] = (multipleReturnValues)()
	$.println(x)
	$.println(z)

	let [, y, ] = (multipleReturnValues)()
	$.println(y)
}

