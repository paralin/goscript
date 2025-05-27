import * as $ from "@goscript/builtin/builtin.js";
import { lstatNolog, statNolog } from "./stat_js.gs.js";
import { Time, FileMode } from "./types_js.gs.js";

// Stat returns a [FileInfo] describing the named file.
// If there is an error, it will be of type [*PathError].
export function Stat(name: string): [null | {
	IsDir(): boolean
	ModTime(): any
	Mode(): any
	Name(): string
	Size(): number
	Sys(): null | any
}, $.GoError] {
	// testlog.Stat(name) // Testlog not available in JavaScript
	return statNolog(name)
}

// Lstat returns a [FileInfo] describing the named file.
// If the file is a symbolic link, the returned FileInfo
// describes the symbolic link. Lstat makes no attempt to follow the link.
// If there is an error, it will be of type [*PathError].
//
// On Windows, if the file is a reparse point that is a surrogate for another
// named entity (such as a symbolic link or mounted folder), the returned
// FileInfo describes the reparse point, and makes no attempt to resolve it.
export function Lstat(name: string): [null | {
	IsDir(): boolean
	ModTime(): Time
	Mode(): FileMode
	Name(): string
	Size(): number
	Sys(): null | any
}, $.GoError] {
	// testlog.Stat(name) // Testlog not available in JavaScript
	return lstatNolog(name)
}

