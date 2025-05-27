import * as $ from "@goscript/builtin/builtin.js";
import { ErrUnimplemented } from "./error.gs.js";
import { File } from "./types_js.gs.js";

import * as fs from "@goscript/io/fs/index.js"

// JavaScript-specific implementations for Unix file operations
// These functions stub Unix-specific operations that cannot be implemented in JavaScript

// Device null path - stub for JavaScript
export const DevNull = "/dev/null"

// Stdin, Stdout, Stderr - stub implementations
export const Stdin: File | null = null
export const Stdout: File | null = null  
export const Stderr: File | null = null

// NewFile creates a File from a file descriptor - stub implementation
export function NewFile(fd: number, name: string): File | null {
	return null
}

// File operations that need to be stubbed
export function Remove(name: string): $.GoError {
	return ErrUnimplemented
}

export function Link(oldname: string, newname: string): $.GoError {
	return ErrUnimplemented
}

export function Symlink(oldname: string, newname: string): $.GoError {
	return ErrUnimplemented
}

export function Truncate(name: string, size: number): $.GoError {
	return ErrUnimplemented
}

// Internal stub functions that may be referenced by other files
export function rename(oldname: string, newname: string): $.GoError {
	return ErrUnimplemented
}

export function openFileNolog(name: string, flag: number, perm: number): [File | null, $.GoError] {
	return [null, ErrUnimplemented]
}

export function openDirNolog(name: string): [File | null, $.GoError] {
	return [null, ErrUnimplemented]
}

export function tempDir(): string {
	return "/tmp"
}

export function readlink(name: string): [string, $.GoError] {
	return ["", ErrUnimplemented]
}

// File class methods that need to be stubbed for unix compatibility
export function fixLongPath(path: string): string {
	return path
}

export function sigpipe(): void {
	// No-op in JavaScript
}

export function epipecheck(file: File | null, e: $.GoError): void {
	// No-op in JavaScript  
}

// dirInfo stub for compatibility
export interface dirInfo {
	close(): void
}

// Network file creation stub  
export function net_newUnixFile(fd: number, name: string): File | null {
	return null
}

// File kind enum for compatibility
export type newFileKind = number

export function newFile(fd: number, name: string, kind: newFileKind, nonBlocking: boolean): File | null {
	return null
}

// Directory entry stubs
export function newUnixDirent(parent: string, name: string, typ: number): [fs.DirEntry | null, $.GoError] {
	return [null, ErrUnimplemented]
} 