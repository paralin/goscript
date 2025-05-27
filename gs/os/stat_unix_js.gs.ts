import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";

import * as fs from "@goscript/io/fs/index.js"

// JavaScript-specific stub implementations for Unix stat operations
// These operations cannot be implemented in JavaScript environments

// statNolog stats a file with no test logging - stub implementation
export function statNolog(name: string): [fs.FileInfo | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// lstatNolog lstats a file with no test logging - stub implementation  
export function lstatNolog(name: string): [fs.FileInfo | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// Additional compatibility exports
export function fillFileStatFromSys(fs: any, name: string): void {
	// No-op in JavaScript
}

// fileStat stub for compatibility
export interface fileStat {
	sys: any
} 