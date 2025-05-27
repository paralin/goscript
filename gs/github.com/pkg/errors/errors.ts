import * as $ from "../../../builtin/builtin.js";
import { callers } from "./stack.js";

// Type definitions
export type Frame = any; // Simplified frame type
export type StackTrace = Frame[] | null;
export type stack = any; // Simplified stack type
export type uintptr = number;

// Simplified fmt functions for basic string formatting
const fmt = {
  Sprintf: (format: string, ...args: any[]): string => {
    // Basic sprintf implementation for the errors package
    let result = format;
    let argIndex = 0;
    result = result.replace(/%[sdqv%]/g, (match) => {
      if (match === '%%') return '%';
      if (argIndex >= args.length) return match;
      const arg = args[argIndex++];
      switch (match) {
        case '%s': return String(arg);
        case '%d': return String(Number(arg));
        case '%q': return JSON.stringify(String(arg));
        case '%v': return String(arg);
        default: return match;
      }
    });
    return result;
  }
};

// New returns an error with the supplied message.
// New also records the stack trace at the point it was called.
export function New(message: string): $.GoError {
	return new fundamental({msg: message, stack: callers()})
}

// Errorf formats according to a format specifier and returns the string
// as a value that satisfies error.
// Errorf also records the stack trace at the point it was called.
export function Errorf(format: string, ...args: any[]): $.GoError {
	return new fundamental({msg: fmt.Sprintf(format, ...args), stack: callers()})
}

class fundamental {
	public get msg(): string {
		return this._fields.msg.value
	}
	public set msg(value: string) {
		this._fields.msg.value = value
	}

	public get stack(): $.VarRef<stack> | null {
		return this._fields.stack.value
	}
	public set stack(value: $.VarRef<stack> | null) {
		this._fields.stack.value = value
	}

	public _fields: {
		msg: $.VarRef<string>;
		stack: $.VarRef<$.VarRef<stack> | null>;
	}

	constructor(init?: Partial<{msg?: string, stack?: $.VarRef<stack> | null}>) {
		this._fields = {
			msg: $.varRef(init?.msg ?? ""),
			stack: $.varRef(init?.stack ?? null)
		}
	}

	public clone(): fundamental {
		const cloned = new fundamental()
		cloned._fields = {
			msg: $.varRef(this._fields.msg.value),
			stack: $.varRef(this._fields.stack.value)
		}
		return cloned
	}

	public Error(): string {
		const f = this
		return f!.msg
	}

	public StackTrace(): StackTrace {
		return null; // Simplified - no stack trace for now
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'fundamental',
	  new fundamental(),
	  [{ name: "Error", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  fundamental,
	  {"msg": { kind: $.TypeKind.Basic, name: "string" }, "stack": { kind: $.TypeKind.Pointer, elemType: "stack" }}
	);
}

// WithStack annotates err with a stack trace at the point WithStack was called.
// If err is nil, WithStack returns nil.
export function WithStack(err: $.GoError): $.GoError {
	if (err == null) {
		return null
	}
	return new withStack({error: err, stack: callers()})
}

class withStack {
	public get error(): $.GoError {
		return this._fields.error.value
	}
	public set error(value: $.GoError) {
		this._fields.error.value = value
	}

	public get stack(): $.VarRef<stack> | null {
		return this._fields.stack.value
	}
	public set stack(value: $.VarRef<stack> | null) {
		this._fields.stack.value = value
	}

	public _fields: {
		error: $.VarRef<$.GoError>;
		stack: $.VarRef<$.VarRef<stack> | null>;
	}

	constructor(init?: Partial<{error?: $.GoError, stack?: $.VarRef<stack> | null}>) {
		this._fields = {
			error: $.varRef(init?.error ?? null),
			stack: $.varRef(init?.stack ?? null)
		}
	}

	public clone(): withStack {
		const cloned = new withStack()
		cloned._fields = {
			error: $.varRef(this._fields.error.value),
			stack: $.varRef(this._fields.stack.value)
		}
		return cloned
	}

	public Cause(): $.GoError {
		const w = this
		return w!.error
	}

	// Unwrap provides compatibility for Go 1.13 error chains.
	public Unwrap(): $.GoError {
		const w = this
		return w!.error
	}

	public Error(): string {
		return this.error?.Error() ?? ""
	}

	public StackTrace(): StackTrace {
		return null; // Simplified - no stack trace for now
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'withStack',
	  new withStack(),
	  [{ name: "Cause", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Unwrap", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  withStack,
	  {"error": { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] }, "stack": { kind: $.TypeKind.Pointer, elemType: "stack" }}
	);
}

// Wrap returns an error annotating err with a stack trace
// at the point Wrap is called, and the supplied message.
// If err is nil, Wrap returns nil.
export function Wrap(err: $.GoError, message: string): $.GoError {
	if (err == null) {
		return null
	}
	const wrappedErr = new withMessage({cause: err, msg: message})
	return new withStack({error: wrappedErr, stack: callers()})
}

// Wrapf returns an error annotating err with a stack trace
// at the point Wrapf is called, and the format specifier.
// If err is nil, Wrapf returns nil.
export function Wrapf(err: $.GoError, format: string, ...args: any[]): $.GoError {
	if (err == null) {
		return null
	}
	const wrappedErr = new withMessage({cause: err, msg: fmt.Sprintf(format, ...args)})
	return new withStack({error: wrappedErr, stack: callers()})
}

// WithMessage annotates err with a new message.
// If err is nil, WithMessage returns nil.
export function WithMessage(err: $.GoError, message: string): $.GoError {
	if (err == null) {
		return null
	}
	return new withMessage({cause: err, msg: message})
}

// WithMessagef annotates err with the format specifier.
// If err is nil, WithMessagef returns nil.
export function WithMessagef(err: $.GoError, format: string, ...args: any[]): $.GoError {
	if (err == null) {
		return null
	}
	return new withMessage({cause: err, msg: fmt.Sprintf(format, ...args)})
}

class withMessage {
	public get cause(): $.GoError {
		return this._fields.cause.value
	}
	public set cause(value: $.GoError) {
		this._fields.cause.value = value
	}

	public get msg(): string {
		return this._fields.msg.value
	}
	public set msg(value: string) {
		this._fields.msg.value = value
	}

	public _fields: {
		cause: $.VarRef<$.GoError>;
		msg: $.VarRef<string>;
	}

	constructor(init?: Partial<{cause?: $.GoError, msg?: string}>) {
		this._fields = {
			cause: $.varRef(init?.cause ?? null),
			msg: $.varRef(init?.msg ?? "")
		}
	}

	public clone(): withMessage {
		const cloned = new withMessage()
		cloned._fields = {
			cause: $.varRef(this._fields.cause.value),
			msg: $.varRef(this._fields.msg.value)
		}
		return cloned
	}

	public Error(): string {
		const w = this
		return w!.msg + ": " + w!.cause!.Error()
	}

	public Cause(): $.GoError {
		const w = this
		return w!.cause
	}

	// Unwrap provides compatibility for Go 1.13 error chains.
	public Unwrap(): $.GoError {
		const w = this
		return w!.cause
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'withMessage',
	  new withMessage(),
	  [{ name: "Error", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Cause", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Unwrap", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  withMessage,
	  {"cause": { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] }, "msg": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

// Cause returns the underlying cause of the error, if possible.
// An error value has a cause if it implements the following
// interface:
//
//     type causer interface {
//            Cause() error
//     }
//
// If the error does not implement Cause, the original error will
// be returned. If the error is nil, nil will be returned without further
// investigation.
export function Cause(err: $.GoError): $.GoError {
	type causer = null | {
		Cause(): $.GoError
	}

	$.registerInterfaceType(
	  'causer',
	  null, // Zero value for interface is null
	  [{ name: "Cause", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
	);

	for (; err != null; ) {
		let { value: cause, ok: ok } = $.typeAssert<causer>(err, 'causer')
		if (!ok) {
			break
		}
		err = cause!.Cause()
	}
	return err
}

