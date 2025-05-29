import * as $ from "@goscript/builtin/index.js";
import { underlyingError, ErrUnimplemented } from "./error.gs.js";
import { Root } from "./root_js.gs.js";
import { File } from "./types_js.gs.js";

import * as errors from "@goscript/errors/index.js"
import * as fs from "@goscript/io/fs/index.js"

// Stub functions for JavaScript environment - these operations cannot be implemented properly

// openRootNolog is OpenRoot - stub implementation
export function openRootNolog(name: string): [Root | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// openRootInRoot is Root.OpenRoot - stub implementation  
export function openRootInRoot(r: Root | null, name: string): [Root | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// newRoot returns a new Root - stub implementation
export function newRoot(name: string): [Root | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// rootOpenFileNolog is Root.OpenFile - stub implementation
export function rootOpenFileNolog(r: Root | null, name: string, flag: number, perm: number): [File | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// rootStat - stub implementation
export function rootStat(r: Root | null, name: string, lstat: boolean): [fs.FileInfo | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// rootMkdir - stub implementation  
export function rootMkdir(r: Root | null, name: string, perm: number): $.GoError {
	return ErrUnimplemented
}

// rootRemove - stub implementation
export function rootRemove(r: Root | null, name: string): $.GoError {
	return ErrUnimplemented
}

