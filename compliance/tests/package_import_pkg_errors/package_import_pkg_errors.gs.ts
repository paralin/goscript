// Generated file based on package_import_pkg_errors.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as errors from "@goscript/github.com/pkg/errors/index.js"

export async function main(): Promise<void> {
	// Test New
	let err1 = errors.New("basic error")
	console.log("New error:", err1!.Error())

	// Test Errorf
	let err2 = errors.Errorf("formatted error: %d", 42)
	console.log("Errorf error:", err2!.Error())

	// Test WithStack
	let baseErr = errors.New("base error")
	let err3 = errors.WithStack(baseErr)
	console.log("WithStack error:", err3!.Error())

	// Test Wrap
	let err4 = errors.Wrap(baseErr, "wrapped message")
	console.log("Wrap error:", err4!.Error())

	// Test Wrapf
	let err5 = errors.Wrapf(baseErr, "wrapped with format: %s", "test")
	console.log("Wrapf error:", err5!.Error())

	// Test WithMessage
	let err6 = errors.WithMessage(baseErr, "additional message")
	console.log("WithMessage error:", err6!.Error())

	// Test WithMessagef
	let err7 = errors.WithMessagef(baseErr, "additional formatted message: %d", 123)
	console.log("WithMessagef error:", err7!.Error())

	// Test Cause
	let cause = errors.Cause(err4)
	console.log("Cause error:", cause!.Error())

	// Test nil handling
	let nilErr = null
	if (nilErr == null) {
		console.log("WithStack with nil returns nil")
	}

	let nilWrap = errors.Wrap(null, "message")
	if (nilWrap == null) {
		console.log("Wrap with nil returns nil")
	}

	// Test Go 1.13 error handling
	let unwrapped = errors.Unwrap(err4)
	if (unwrapped != null) {
		console.log("Unwrap error:", unwrapped!.Error())
	}

	// Test Is
	if (errors.Is(err4, baseErr)) {
		console.log("Is check passed")
	}

	console.log("test finished")
}

