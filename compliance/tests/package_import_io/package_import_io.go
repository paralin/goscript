package main

import "io"

func main() {
	// Test basic error variables
	println("EOF:", io.EOF.Error())
	println("ErrClosedPipe:", io.ErrClosedPipe.Error())
	println("ErrShortWrite:", io.ErrShortWrite.Error())
	println("ErrUnexpectedEOF:", io.ErrUnexpectedEOF.Error())

	// Test seek constants
	println("SeekStart:", io.SeekStart)
	println("SeekCurrent:", io.SeekCurrent)
	println("SeekEnd:", io.SeekEnd)

	// Test Discard writer
	n, err := io.WriteString(io.Discard, "hello world")
	println("WriteString to Discard - bytes:", n, "err:", err == nil)

	println("test finished")
}
