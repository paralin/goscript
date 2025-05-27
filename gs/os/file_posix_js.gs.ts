import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";

// JavaScript-specific stubs for POSIX file operations
// These operations are not available in JavaScript environments

// syscallMode stub
export function syscallMode(i: number): number {
	return 0
}

// ignoringEINTR stub
export function ignoringEINTR(fn: () => $.GoError): $.GoError {
	return ErrUnimplemented
}

// ignoringEINTR2 stub
export function ignoringEINTR2(fn: () => [string, $.GoError]): [string, $.GoError] {
	return ["", ErrUnimplemented]
}

// Chmod operation stub
export function Chmod(name: string, mode: number): $.GoError {
	return ErrUnimplemented
}

// Chown operation stub
export function Chown(name: string, uid: number, gid: number): $.GoError {
	return ErrUnimplemented
}

// Lchown operation stub
export function Lchown(name: string, uid: number, gid: number): $.GoError {
	return ErrUnimplemented
}

// Chtimes operation stub
export function Chtimes(name: string, atime: any, mtime: any): $.GoError {
	return ErrUnimplemented
} 