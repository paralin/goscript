package main

import "strings"

func main() {
	// This should trigger the unhandled make call error
	// strings.Builder uses make internally for its buffer
	var builder strings.Builder
	builder.WriteString("Hello")
	builder.WriteString(" ")
	builder.WriteString("World")

	result := builder.String()
	println("Result:", result)

	// Also test direct make with strings.Builder
	builderPtr := &strings.Builder{}
	builderPtr.WriteString("Direct make test")
	println("Direct:", builderPtr.String())
}
