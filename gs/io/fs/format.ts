import * as $ from "@goscript/builtin/builtin.js";
import { FileInfo, DirEntry, fileModeString, fileModeType } from "./fs.js";

import * as time from "@goscript/time/index.js"

// FormatFileInfo returns a formatted version of info for human readability.
// Implementations of [FileInfo] can call this from a String method.
// The output for a file named "hello.go", 100 bytes, mode 0o644, created
// January 1, 1970 at noon is
//
//	-rw-r--r-- 100 1970-01-01 12:00:00 hello.go
export function FormatFileInfo(info: FileInfo): string {
	let name = info!.Name()
	let b: string[] = []
	b.push(fileModeString(info!.Mode()))
	b.push(" ")

	let size = info!.Size()
	let usize: number = 0
	if (size >= 0) {
		usize = (size as number)
	} else {
		b.push("-")
		usize = (-size as number)
	}
	
	b.push(usize.toString())
	b.push(" ")

	// Use a simple date format since time.DateTime is not available
	b.push(info!.ModTime()!.Format(time.DateTime))
	b.push(" ")

	b.push(name)
	if (info!.IsDir()) {
		b.push("/")
	}

	return b.join("")
}

// FormatDirEntry returns a formatted version of dir for human readability.
// Implementations of [DirEntry] can call this from a String method.
// The outputs for a directory named subdir and a file named hello.go are:
//
//	d subdir/
//	- hello.go
export function FormatDirEntry(dir: DirEntry): string {
	let name = dir!.Name()
	let b: string[] = []

	// The Type method does not return any permission bits,
	// so strip them from the string.
	let mode = fileModeString(dir!.Type())
	mode = $.sliceString(mode, undefined, $.len(mode) - 9)

	b.push(mode)
	b.push(" ")
	b.push(name)
	if (dir!.IsDir()) {
		b.push("/")
	}
	return b.join("")
}

