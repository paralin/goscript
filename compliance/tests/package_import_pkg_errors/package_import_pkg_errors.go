package main

import "github.com/pkg/errors"

func main() {
	// Test New
	err1 := errors.New("basic error")
	println("New error:", err1.Error())

	// Test Errorf
	err2 := errors.Errorf("formatted error: %d", 42)
	println("Errorf error:", err2.Error())

	// Test WithStack
	baseErr := errors.New("base error")
	err3 := errors.WithStack(baseErr)
	println("WithStack error:", err3.Error())

	// Test Wrap
	err4 := errors.Wrap(baseErr, "wrapped message")
	println("Wrap error:", err4.Error())

	// Test Wrapf
	err5 := errors.Wrapf(baseErr, "wrapped with format: %s", "test")
	println("Wrapf error:", err5.Error())

	// Test WithMessage
	err6 := errors.WithMessage(baseErr, "additional message")
	println("WithMessage error:", err6.Error())

	// Test WithMessagef
	err7 := errors.WithMessagef(baseErr, "additional formatted message: %d", 123)
	println("WithMessagef error:", err7.Error())

	// Test Cause
	cause := errors.Cause(err4)
	println("Cause error:", cause.Error())

	// Test nil handling
	nilErr := errors.WithStack(nil)
	if nilErr == nil {
		println("WithStack with nil returns nil")
	}

	nilWrap := errors.Wrap(nil, "message")
	if nilWrap == nil {
		println("Wrap with nil returns nil")
	}

	// Test Go 1.13 error handling
	unwrapped := errors.Unwrap(err4)
	if unwrapped != nil {
		println("Unwrap error:", unwrapped.Error())
	}

	// Test Is
	if errors.Is(err4, baseErr) {
		println("Is check passed")
	}

	println("test finished")
}
