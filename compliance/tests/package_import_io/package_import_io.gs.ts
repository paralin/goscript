// Generated file based on package_import_io.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/builtin.js";

import * as io from "@goscript/io/index.js"

export async function main(): Promise<void> {
	// Test basic error variables
	console.log("EOF:", io.EOF!.Error())
	console.log("ErrClosedPipe:", io.ErrClosedPipe!.Error())
	console.log("ErrShortWrite:", io.ErrShortWrite!.Error())
	console.log("ErrUnexpectedEOF:", io.ErrUnexpectedEOF!.Error())

	// Test seek constants
	console.log("SeekStart:", io.SeekStart)
	console.log("SeekCurrent:", io.SeekCurrent)
	console.log("SeekEnd:", io.SeekEnd)

	// Test Discard writer
	let [n, err] = io.WriteString(io.Discard, "hello world")
	console.log("WriteString to Discard - bytes:", n, "err:", err == null)

	console.log("test finished")
}

