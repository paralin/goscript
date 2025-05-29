import * as $ from "@goscript/builtin/index.js";

import * as fs from "@goscript/io/fs/index.js"

// JavaScript-specific implementation of Getwd
// Working directories are not a concept in JavaScript environments
// Store working directory in a global variable

// Global working directory variable, defaults to test directory
let currentWorkingDir: string = "/"

export function Getwd(): [string, $.GoError] {
	return [currentWorkingDir, null]
}

// Set the working directory (for internal use)
export function setWorkingDir(dir: string): void {
	currentWorkingDir = dir
}

// Additional functions that may be imported by other files
export function statNolog(name: string): [fs.FileInfo | null, $.GoError] {
	return [null, fs.ErrNotExist]
}

export function lstatNolog(name: string): [fs.FileInfo | null, $.GoError] {
	return [null, fs.ErrNotExist]
} 