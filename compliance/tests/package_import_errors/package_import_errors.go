package main

import "errors"

func main() {
	// Test basic error creation
	err1 := errors.New("first error")
	err2 := errors.New("second error")

	println("err1:", err1.Error())
	println("err2:", err2.Error())

	// Test error comparison
	println("err1 == err2:", err1 == err2)
	println("err1 == nil:", err1 == nil)

	// Test nil error
	var nilErr error
	println("nilErr == nil:", nilErr == nil)

	println("test finished")
}
