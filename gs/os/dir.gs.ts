import * as $ from "@goscript/builtin/index.js";
import { ErrUnimplemented } from "./error.gs.js";

import * as fs from "@goscript/io/fs/index.js"

type DirEntry = fs.DirEntry;

// ReadDir reads the named directory,
// returning all its directory entries sorted by filename.
// If an error occurs reading the directory,
// ReadDir returns the entries it was able to read before the error,
// along with the error.
export function ReadDir(name: string): [$.Slice<DirEntry>, $.GoError] {
	// Directory reading not supported in JavaScript environment
	return [null, ErrUnimplemented]
}

// CopyFS copies the file system fsys into the directory dir,
// creating dir if necessary.
//
// Files are created with mode 0o666 plus any execute permissions
// from the source, and directories are created with mode 0o777
// (before umask).
//
// CopyFS will not overwrite existing files. If a file name in fsys
// already exists in the destination, CopyFS will return an error
// such that errors.Is(err, fs.ErrExist) will be true.
//
// Symbolic links in fsys are not supported. A *PathError with Err set
// to ErrInvalid is returned when copying from a symbolic link.
//
// Symbolic links in dir are followed.
//
// New files added to fsys (including if dir is a subdirectory of fsys)
// while CopyFS is running are not guaranteed to be copied.
//
// Copying stops at and returns the first error encountered.
export function CopyFS(dir: string, fsys: fs.FS): $.GoError {
	// File system copying not supported in JavaScript environment
	return ErrUnimplemented
}

