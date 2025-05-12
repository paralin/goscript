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
