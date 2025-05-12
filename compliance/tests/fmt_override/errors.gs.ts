// Generated file based on errors.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

import * as errors from "@goscript/errors"

import * as slices from "@goscript/slices"

// Errorf formats according to a format specifier and returns the string as a
// value that satisfies error.
//
// If the format specifier includes a %w verb with an error operand,
// the returned error will implement an Unwrap method returning the operand.
// If there is more than one %w verb, the returned error will implement an
// Unwrap method returning a []error containing all the %w operands in the
// order they appear in the arguments.
// It is invalid to supply the %w verb with an operand that does not implement
// the error interface. The %w verb is otherwise a synonym for %v.
export function Errorf(format: string, ...a: any/* unhandled type: *types.Alias */[]): $.Error {
	let p = newPrinter()
	p.wrapErrs = true
	p.doPrintf(format, a)
	let s = $.runesToString(p.buf)
	let err: $.Error = null
	switch ($.len(p.wrappedErrs)) {
		case 0:
			err = errors.New(s)
			break
		case 1:
			let w = new wrapError({msg: s})
			({ value: w.err } = $.typeAssert<$.Error>(a![p.wrappedErrs![0]], 'error'))
			err = w
			break
		default:
			if (p.reordered) {
				slices.Sort(p.wrappedErrs)
			}
			let errs: $.Slice<$.Error> = null
			for (let i = 0; i < p.wrappedErrs.length; i++) {
				const argNum = p.wrappedErrs[i]
				{
					if (i > 0 && p.wrappedErrs![i - 1] == argNum) {
						continue
					}
					{let { value: e, ok: ok } = $.typeAssert<$.Error>(a![argNum], 'error')
						if (ok) {
							errs = $.append(errs, e)
						}
					}}
			}
			err = new wrapErrors({})
			break
	}
	p.free()
	return err
}

class wrapError {
	public get msg(): string {
		return this._fields.msg.value
	}
	public set msg(value: string) {
		this._fields.msg.value = value
	}

	public get err(): $.Error {
		return this._fields.err.value
	}
	public set err(value: $.Error) {
		this._fields.err.value = value
	}

	public _fields: {
		msg: $.Box<string>;
		err: $.Box<$.Error>;
	}

	constructor(init?: Partial<{err?: $.Error, msg?: string}>) {
		this._fields = {
			msg: $.box(init?.msg ?? ""),
			err: $.box(init?.err ?? null)
		}
	}

	public clone(): wrapError {
		const cloned = new wrapError()
		cloned._fields = {
			msg: $.box(this._fields.msg.value),
			err: $.box(this._fields.err.value)
		}
		return cloned
	}

	public Error(): string {
		const e = this
		return e.msg
	}

	public Unwrap(): $.Error {
		const e = this
		return e.err
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'wrapError',
	  $.TypeKind.Struct,
	  new wrapError(),
	  new Set(['Error', 'Unwrap']),
	  wrapError
	);
}

class wrapErrors {
	public get msg(): string {
		return this._fields.msg.value
	}
	public set msg(value: string) {
		this._fields.msg.value = value
	}

	public get errs(): $.Slice<$.Error> {
		return this._fields.errs.value
	}
	public set errs(value: $.Slice<$.Error>) {
		this._fields.errs.value = value
	}

	public _fields: {
		msg: $.Box<string>;
		errs: $.Box<$.Slice<$.Error>>;
	}

	constructor(init?: Partial<{errs?: $.Slice<$.Error>, msg?: string}>) {
		this._fields = {
			msg: $.box(init?.msg ?? ""),
			errs: $.box(init?.errs ?? null)
		}
	}

	public clone(): wrapErrors {
		const cloned = new wrapErrors()
		cloned._fields = {
			msg: $.box(this._fields.msg.value),
			errs: $.box(this._fields.errs.value)
		}
		return cloned
	}

	public Error(): string {
		const e = this
		return e.msg
	}

	public Unwrap(): $.Slice<$.Error> {
		const e = this
		return e.errs
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'wrapErrors',
	  $.TypeKind.Struct,
	  new wrapErrors(),
	  new Set(['Error', 'Unwrap']),
	  wrapErrors
	);
}

