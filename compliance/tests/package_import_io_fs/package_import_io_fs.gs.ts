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

	// Test all FileMode constants
	console.log("ModeDir:", $.int(fs.ModeDir))
	console.log("ModeAppend:", $.int(fs.ModeAppend))
	console.log("ModeExclusive:", $.int(fs.ModeExclusive))
	console.log("ModeTemporary:", $.int(fs.ModeTemporary))
	console.log("ModeSymlink:", $.int(fs.ModeSymlink))
	console.log("ModeDevice:", $.int(fs.ModeDevice))
	console.log("ModeNamedPipe:", $.int(fs.ModeNamedPipe))
	console.log("ModeSocket:", $.int(fs.ModeSocket))
	console.log("ModeSetuid:", $.int(fs.ModeSetuid))
	console.log("ModeSetgid:", $.int(fs.ModeSetgid))
	console.log("ModeCharDevice:", $.int(fs.ModeCharDevice))
	console.log("ModeSticky:", $.int(fs.ModeSticky))
	console.log("ModeIrregular:", $.int(fs.ModeIrregular))
	console.log("ModeType:", $.int(fs.ModeType))
	console.log("ModePerm:", $.int(fs.ModePerm))

	// Test FileMode methods
	let mode = ((fs.ModeDir | 0o755) as fs.FileMode)
	console.log("FileMode.IsDir():", fs.FileMode_IsDir(mode))
	console.log("FileMode.IsRegular():", fs.FileMode_IsRegular(mode))
	console.log("FileMode.Perm():", $.int(fs.FileMode_Perm(mode)))
	console.log("FileMode.Type():", $.int(fs.FileMode_Type(mode)))
	console.log("FileMode.String():", fs.FileMode_String(mode))

	let regularMode = (0o644 as fs.FileMode)
	console.log("Regular file IsDir():", fs.FileMode_IsDir(regularMode))
	console.log("Regular file IsRegular():", fs.FileMode_IsRegular(regularMode))

	console.log("test finished")
}

