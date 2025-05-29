import * as $ from "@goscript/builtin/index.js";
import { ErrUnimplemented } from "./error.gs.js";

import * as fs from "@goscript/io/fs/index.js"

// JavaScript-specific stubs for stat operations

// Stat returns a [FileInfo] describing the named file.
// If there is an error, it will be of type [*PathError].
export function Stat(name: string): [fs.FileInfo, $.GoError] {
	return [null, ErrUnimplemented]
}

// Lstat returns a [FileInfo] describing the named file.
// If the file is a symbolic link, the returned FileInfo
// describes the symbolic link. Lstat makes no attempt to follow the link.
// If there is an error, it will be of type [*PathError].
export function Lstat(name: string): [fs.FileInfo, $.GoError] {
	return [null, ErrUnimplemented]
}

// statNolog is the same as Stat, for use in DirFS.
export function statNolog(name: string): [fs.FileInfo, $.GoError] {
	return [null, ErrUnimplemented]
}

// lstatNolog is the same as Lstat, for use in DirFS.
export function lstatNolog(name: string): [fs.FileInfo, $.GoError] {
	return [null, ErrUnimplemented]
} 