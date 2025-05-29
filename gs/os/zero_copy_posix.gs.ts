import * as $ from "@goscript/builtin/index.js";
import { NewSyscallError } from "./error.gs.js";

import * as io from "@goscript/io/index.js"

import * as syscall from "@goscript/syscall/index.js"

// wrapSyscallError takes an error and a syscall name. If the error is
// a syscall.Errno, it wraps it in an os.SyscallError using the syscall name.
export function wrapSyscallError(name: string, err: $.GoError): $.GoError {
	{
		let { ok: ok } = $.typeAssert<syscall.Errno>(err, 'syscall.Errno')
		if (ok) {
			err = NewSyscallError(name, err)
		}
	}
	return err
}

// tryLimitedReader tries to assert the io.Reader to io.LimitedReader, it returns the io.LimitedReader,
// the underlying io.Reader and the remaining amount of bytes if the assertion succeeds,
// otherwise it just returns the original io.Reader and the theoretical unlimited remaining amount of bytes.
export function tryLimitedReader(r: io.Reader): [io.LimitedReader | null, io.Reader, number] {
	// by default, copy until EOF
	let remain: number = Number.MAX_SAFE_INTEGER - 1

	let { value: lr, ok: ok } = $.typeAssert<io.LimitedReader | null>(r, {kind: $.TypeKind.Pointer, elemType: 'io.LimitedReader'})
	if (!ok) {
		return [null, r, remain]
	}

	remain = lr!.N
	return [lr, lr!.R, remain]
}

