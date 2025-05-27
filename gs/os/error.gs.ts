import * as $ from "@goscript/builtin/builtin.js";

// import * as poll from "@goscript/internal/poll/index.js" // Not available in JavaScript

import * as fs from "@goscript/io/fs/index.js"

// ErrInvalid indicates an invalid argument.
// Methods on File will return this error when the receiver is nil.
// "invalid argument"
export let ErrInvalid: $.GoError = fs.ErrInvalid

// "permission denied"
export let ErrPermission: $.GoError = fs.ErrPermission

// "file already exists"
export let ErrExist: $.GoError = fs.ErrExist

// "file does not exist"
export let ErrNotExist: $.GoError = fs.ErrNotExist

// "file already closed"
export let ErrClosed: $.GoError = fs.ErrClosed

// "file type does not support deadline"
export let ErrNoDeadline: $.GoError = errNoDeadline()

// "i/o timeout"
export let ErrDeadlineExceeded: $.GoError = errDeadlineExceeded()

// "operation not implemented in JavaScript environment"
export let ErrUnimplemented: $.GoError = {
	Error: () => "operation not implemented in JavaScript environment"
}

export function errNoDeadline(): $.GoError {
	return {Error: () => "file type does not support deadline"}
}

// errDeadlineExceeded returns the value for os.ErrDeadlineExceeded.
// This error comes from the internal/poll package, which is also
// used by package net. Doing it this way ensures that the net
// package will return os.ErrDeadlineExceeded for an exceeded deadline,
// as documented by net.Conn.SetDeadline, without requiring any extra
// work in the net package and without requiring the internal/poll
// package to import os (which it can't, because that would be circular).
export function errDeadlineExceeded(): $.GoError {
	return {Error: () => "i/o timeout"}
}

type timeout = null | {
	Timeout(): boolean
}

$.registerInterfaceType(
  'timeout',
  null, // Zero value for interface is null
  [{ name: "Timeout", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }]
);

export type PathError = fs.PathError;
export const PathError = null as any;

export class SyscallError {
	public get Syscall(): string {
		return this._fields.Syscall.value
	}
	public set Syscall(value: string) {
		this._fields.Syscall.value = value
	}

	public get Err(): $.GoError {
		return this._fields.Err.value
	}
	public set Err(value: $.GoError) {
		this._fields.Err.value = value
	}

	public _fields: {
		Syscall: $.VarRef<string>;
		Err: $.VarRef<$.GoError>;
	}

	constructor(init?: Partial<{Err?: $.GoError, Syscall?: string}>) {
		this._fields = {
			Syscall: $.varRef(init?.Syscall ?? ""),
			Err: $.varRef(init?.Err ?? null)
		}
	}

	public clone(): SyscallError {
		const cloned = new SyscallError()
		cloned._fields = {
			Syscall: $.varRef(this._fields.Syscall.value),
			Err: $.varRef(this._fields.Err.value)
		}
		return cloned
	}

	public Error(): string {
		const e = this
		return e.Syscall + ": " + e.Err!.Error()
	}

	public Unwrap(): $.GoError {
		const e = this
		return e.Err
	}

	// Timeout reports whether this error represents a timeout.
	public Timeout(): boolean {
		const e = this
		let { value: t, ok: ok } = $.typeAssert<timeout>(e.Err, 'timeout')
		return ok && t!.Timeout()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'SyscallError',
	  new SyscallError(),
	  [{ name: "Error", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Unwrap", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Timeout", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  SyscallError,
	  {"Syscall": { kind: $.TypeKind.Basic, name: "string" }, "Err": { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] }}
	);
}

// NewSyscallError returns, as an error, a new [SyscallError]
// with the given system call name and error details.
// As a convenience, if err is nil, NewSyscallError returns nil.
export function NewSyscallError(syscall: string, err: $.GoError): $.GoError {
	if (err == null) {
		return null
	}
	return new SyscallError({})
}

// IsExist returns a boolean indicating whether its argument is known to report
// that a file or directory already exists. It is satisfied by [ErrExist] as
// well as some syscall errors.
//
// This function predates [errors.Is]. It only supports errors returned by
// the os package. New code should use errors.Is(err, fs.ErrExist).
export function IsExist(err: $.GoError): boolean {
	return underlyingErrorIs(err, ErrExist)
}

// IsNotExist returns a boolean indicating whether its argument is known to
// report that a file or directory does not exist. It is satisfied by
// [ErrNotExist] as well as some syscall errors.
//
// This function predates [errors.Is]. It only supports errors returned by
// the os package. New code should use errors.Is(err, fs.ErrNotExist).
export function IsNotExist(err: $.GoError): boolean {
	return underlyingErrorIs(err, ErrNotExist)
}

// IsPermission returns a boolean indicating whether its argument is known to
// report that permission is denied. It is satisfied by [ErrPermission] as well
// as some syscall errors.
//
// This function predates [errors.Is]. It only supports errors returned by
// the os package. New code should use errors.Is(err, fs.ErrPermission).
export function IsPermission(err: $.GoError): boolean {
	return underlyingErrorIs(err, ErrPermission)
}

// IsTimeout returns a boolean indicating whether its argument is known
// to report that a timeout occurred.
//
// This function predates [errors.Is], and the notion of whether an
// error indicates a timeout can be ambiguous. For example, the Unix
// error EWOULDBLOCK sometimes indicates a timeout and sometimes does not.
// New code should use errors.Is with a value appropriate to the call
// returning the error, such as [os.ErrDeadlineExceeded].
export function IsTimeout(err: $.GoError): boolean {
	let { value: terr, ok: ok } = $.typeAssert<timeout>(underlyingError(err), 'timeout')
	return ok && terr!.Timeout()
}

export function underlyingErrorIs(err: $.GoError, target: $.GoError): boolean {
	// Note that this function is not errors.Is:
	// underlyingError only unwraps the specific error-wrapping types
	// that it historically did, not all errors implementing Unwrap().
	err = underlyingError(err)
	if (err == target) {
		return true
	}
	// To preserve prior behavior, only examine syscall errors.
	let { value: e, ok: ok } = $.typeAssert<any>(err, 'syscallErrorType')
	return ok && e.Is(target)
}

// underlyingError returns the underlying error for known os error types.
export function underlyingError(err: $.GoError): $.GoError {
	$.typeSwitch(err, [{ types: [{kind: $.TypeKind.Pointer, elemType: 'PathError'}], body: (err) => {
		return err!.Err
	}},
	{ types: [{kind: $.TypeKind.Pointer, elemType: 'LinkError'}], body: (err) => {
		return err!.Err
	}},
	{ types: [{kind: $.TypeKind.Pointer, elemType: 'SyscallError'}], body: (err) => {
		return err!.Err
	}}])
	return err
}

