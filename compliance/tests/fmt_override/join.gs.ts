// Generated file based on join.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

import * as unsafe from "@goscript/unsafe"

// Join returns an error that wraps the given errors.
// Any nil error values are discarded.
// Join returns nil if every value in errs is nil.
// The error formats as the concatenation of the strings obtained
// by calling the Error method of each element of errs, with a newline
// between each string.
//
// A non-nil error returned by Join implements the Unwrap() []error method.
export function Join(...errs: $.Error[]): $.Error {
	let n = 0
	for (let i = 0; i < errs.length; i++) {
		const err = errs[i]
		{
			if (err != null) {
				n++
			}
		}
	}
	if (n == 0) {
		return null
	}
	let e = new joinError({errs: $.makeSlice<$.Error>(0, n)})
	for (let i = 0; i < errs.length; i++) {
		const err = errs[i]
		{
			if (err != null) {
				e.errs = $.append(e.errs, err)
			}
		}
	}
	return e
}

class joinError {
	public get errs(): $.Slice<$.Error> {
		return this._fields.errs.value
	}
	public set errs(value: $.Slice<$.Error>) {
		this._fields.errs.value = value
	}

	public _fields: {
		errs: $.Box<$.Slice<$.Error>>;
	}

	constructor(init?: Partial<{errs?: $.Slice<$.Error>}>) {
		this._fields = {
			errs: $.box(init?.errs ?? null)
		}
	}

	public clone(): joinError {
		const cloned = new joinError()
		cloned._fields = {
			errs: $.box(this._fields.errs.value)
		}
		return cloned
	}

	public Error(): string {
		const e = this
		if ($.len(e.errs) == 1) {
			return e.errs![0].Error()
		}
		let b = // unhandled value expr: *ast.ArrayType
		(e.errs![0].Error())
		for (let i = 0; i < $.goSlice(e.errs, 1, undefined).length; i++) {
			const err = $.goSlice(e.errs, 1, undefined)[i]
			{
				b = $.append(b, 10)
				b = $.append(b, err.Error())
			}
		}
		return unsafe.String(b![0], $.len(b))
	}

	public Unwrap(): $.Slice<$.Error> {
		const e = this
		return e.errs
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerType(
	  'joinError',
	  $.TypeKind.Struct,
	  new joinError(),
	  new Set(['Error', 'Unwrap']),
	  joinError
	);
}

