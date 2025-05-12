// Generated file based on wrap.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin";

import * as reflectlite from "@goscript/internal/reflectlite"

// Unwrap returns the result of calling the Unwrap method on err, if err's
// type contains an Unwrap method returning error.
// Otherwise, Unwrap returns nil.
//
// Unwrap only calls a method of the form "Unwrap() error".
// In particular Unwrap does not unwrap errors returned by [Join].
export function Unwrap(err: $.Error): $.Error {
	let { value: u, ok: ok } = $.typeAssert<null | {
		Unwrap(): $.Error
	}>(err, 'unknown')
	if (!ok) {
		return null
	}
	return u.Unwrap()
}

// Is reports whether any error in err's tree matches target.
//
// The tree consists of err itself, followed by the errors obtained by repeatedly
// calling its Unwrap() error or Unwrap() []error method. When err wraps multiple
// errors, Is examines err followed by a depth-first traversal of its children.
//
// An error is considered to match a target if it is equal to that target or if
// it implements a method Is(error) bool such that Is(target) returns true.
//
// An error type might provide an Is method so it can be treated as equivalent
// to an existing error. For example, if MyError defines
//
//	func (m MyError) Is(target error) bool { return target == fs.ErrExist }
//
// then Is(MyError{}, fs.ErrExist) returns true. See [syscall.Errno.Is] for
// an example in the standard library. An Is method should only shallowly
// compare err and the target and not call [Unwrap] on either.
export function Is(errtarget: $.Error): boolean {
	if (err == null || target == null) {
		return err == target
	}

	let isComparable = reflectlite.TypeOf(target).Comparable()
	return is(err, target, isComparable)
}

function is(errtarget: $.Error, targetComparable: boolean): boolean {
	for (; ; ) {
		if (targetComparable && err == target) {
			return true
		}
		{let { value: x, ok: ok } = $.typeAssert<null | {
				Is(_p0: $.Error): boolean
			}>(err, 'unknown')
			if (ok && x.Is(target)) {
				return true
			}
		}