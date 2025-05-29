// Generated file based on package_import_errors.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as errors from "@goscript/errors/index.js"

export async function main(): Promise<void> {
	// Test basic error creation
	let err1 = errors.New("first error")
	let err2 = errors.New("second error")

	console.log("err1:", err1!.Error())
	console.log("err2:", err2!.Error())

	// Test error comparison
	console.log("err1 == err2:", err1 == err2)
	console.log("err1 == nil:", err1 == null)

	// Test nil error
	let nilErr: $.GoError = null
	console.log("nilErr == nil:", nilErr == null)

	console.log("test finished")
}

