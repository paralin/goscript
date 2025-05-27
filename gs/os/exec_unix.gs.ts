import * as $ from "@goscript/builtin/builtin.js";
import { NewSyscallError, ErrUnimplemented } from "./error.gs.js";
import { newDoneProcess, newHandleProcess, newPIDProcess, Process, ErrProcessDone } from "./exec.gs.js";

import * as errors from "@goscript/errors/index.js"

import * as runtime from "@goscript/runtime/index.js"

import * as syscall from "@goscript/syscall/index.js"

import * as time from "@goscript/time/index.js"

// Import uintptr type
type uintptr = syscall.uintptr

// Stub functions for JavaScript environment
function ignoringEINTR2(fn: any, arg1: any, arg2: any): [any, $.GoError] {
	return [null, ErrUnimplemented]
}

function pidfdFind(pid: number): [uintptr, $.GoError] {
	return [0, ErrUnimplemented]
}

// Special values for Process.Pid.
let pidUnset: number = 0

let pidReleased: number = -1

export function convertESRCH(err: $.GoError): $.GoError {
	if (err == syscall.ESRCH) {
		return ErrProcessDone
	}
	return err
}

export function findProcess(pid: number): [Process | null, $.GoError] {
	let p: Process | null = null
	let err: $.GoError = null
	{
		let h: uintptr
		[h, err] = pidfdFind(pid)

		// We can't return an error here since users are not expecting
		// it. Instead, return a process with a "done" state already
		// and let a subsequent Signal or Wait call catch that.

		// Ignore other errors from pidfdFind, as the callers
		// do not expect them. Fall back to using the PID.
		if (err == ErrProcessDone) {
			// We can't return an error here since users are not expecting
			// it. Instead, return a process with a "done" state already
			// and let a subsequent Signal or Wait call catch that.
			return [newDoneProcess(pid), null]
		} else if (err != null) {
			// Ignore other errors from pidfdFind, as the callers
			// do not expect them. Fall back to using the PID.
			return [newPIDProcess(pid), null]
		}
		// Use the handle.
		return [newHandleProcess(pid, h), null]
	}
}

