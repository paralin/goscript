import * as $ from "@goscript/builtin/index.js";
import { NewSyscallError, ErrUnimplemented } from "./error.gs.js";

import * as runtime from "@goscript/runtime/index.js"

import * as syscall from "@goscript/syscall/index.js"

export let Args: $.Slice<string> = null

export function init(): void {
	// In JavaScript environment, just initialize with empty args
	Args = runtime_args()
}

export function runtime_args(): $.Slice<string> {
	return $.arrayToSlice<string>([])
}

// Getuid returns the numeric user id of the caller.
//
// On Windows, it returns -1.
export function Getuid(): number {
	return -1 // Not available in JavaScript
}

// Geteuid returns the numeric effective user id of the caller.
//
// On Windows, it returns -1.
export function Geteuid(): number {
	return -1 // Not available in JavaScript
}

// Getgid returns the numeric group id of the caller.
//
// On Windows, it returns -1.
export function Getgid(): number {
	return -1 // Not available in JavaScript
}

// Getegid returns the numeric effective group id of the caller.
//
// On Windows, it returns -1.
export function Getegid(): number {
	return -1 // Not available in JavaScript
}

// Getgroups returns a list of the numeric ids of groups that the caller belongs to.
//
// On Windows, it returns [syscall.EWINDOWS]. See the [os/user] package
// for a possible alternative.
export function Getgroups(): [$.Slice<number>, $.GoError] {
	return [$.arrayToSlice<number>([]), ErrUnimplemented]
}

// Exit causes the current program to exit with the given status code.
// Conventionally, code zero indicates success, non-zero an error.
// The program terminates immediately; deferred functions are not run.
//
// For portability, the status code should be in the range [0, 125].
export function Exit(code: number): void {

	// Testlog functionality not available in JavaScript - stub
	// if (code == 0 && testlog.PanicOnExit0()) {
	//	$.panic("unexpected call to os.Exit(0) during test")
	// }

	// Inform the runtime that os.Exit is being called. If -race is
	// enabled, this will give race detector a chance to fail the
	// program (racy programs do not have the right to finish
	// successfully). If coverage is enabled, then this call will
	// enable us to write out a coverage data file.
	runtime_beforeExit(code)

	// In JavaScript environment, use process.exit if available
	if (typeof process !== 'undefined' && process.exit) {
		process.exit(code)
	} else {
		// Fallback: just return (can't really exit in browser)
		return
	}
}

export function runtime_beforeExit(exitCode: number): void {}

