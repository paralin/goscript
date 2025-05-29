import * as $ from "@goscript/builtin/index.js";
import { NewSyscallError } from "./error.gs.js";

import * as syscall from "@goscript/syscall/index.js"

// Pipe returns a connected pair of Files; reads from r return bytes written to w.
// It returns the files and an error, if any.
export function Pipe(): [File | null, File | null, $.GoError] {
	let r: File | null = null
	let w: File | null = null
	let err: $.GoError = null
	{
		// Neither GOOS=js nor GOOS=wasip1 have pipes.
		return [null, null, NewSyscallError("pipe", syscall.ENOSYS)]
	}
}

