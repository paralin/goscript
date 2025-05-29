// Generated file based on package_import_io_fs.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as fs from "@goscript/io/fs/index.js"

export async function main(): Promise<void> {
	// Test ValidPath function
	let valid1 = fs.ValidPath("hello/world.txt")
	console.log("ValidPath('hello/world.txt'):", valid1)

	let valid2 = fs.ValidPath("../invalid")
	console.log("ValidPath('../invalid'):", valid2)

	let valid3 = fs.ValidPath(".")
	console.log("ValidPath('.'):", valid3)

	let valid4 = fs.ValidPath("")
	console.log("ValidPath(''):", valid4)

	// Test error constants
	console.log("ErrInvalid:", fs.ErrInvalid!.Error())
	console.log("ErrNotExist:", fs.ErrNotExist!.Error())
	console.log("ErrExist:", fs.ErrExist!.Error())
	console.log("ErrPermission:", fs.ErrPermission!.Error())
	console.log("ErrClosed:", fs.ErrClosed!.Error())

	// Test FileMode constants
	console.log("ModeDir:", $.int(fs.ModeDir))
	console.log("ModePerm:", $.int(fs.ModePerm))

	console.log("test finished")
}

