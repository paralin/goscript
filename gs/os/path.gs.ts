import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";
import { IsPathSeparator } from "./path_unix.gs.js";

// MkdirAll creates a directory named path,
// along with any necessary parents, and returns nil,
// or else returns an error.
// The permission bits perm (before umask) are used for all
// directories that MkdirAll creates.
// If path is already a directory, MkdirAll does nothing
// and returns nil.
export function MkdirAll(path: string, perm: number): $.GoError {
	return ErrUnimplemented
}

// RemoveAll removes path and any children it contains.
// It removes everything it can but returns the first error
// it encounters. If the path does not exist, RemoveAll
// returns nil (no error).
// If there is an error, it will be of type [*PathError].
export function RemoveAll(path: string): $.GoError {
	return ErrUnimplemented
}

// endsWithDot reports whether the final component of path is ".".
export function endsWithDot(path: string): boolean {
	if (path == ".") {
		return true
	}
	if ($.len(path) >= 2 && $.indexString(path, $.len(path) - 1) == 46 && IsPathSeparator($.indexString(path, $.len(path) - 2))) {
		return true
	}
	return false
}

