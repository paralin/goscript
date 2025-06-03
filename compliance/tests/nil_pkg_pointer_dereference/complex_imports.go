package main

import (
	"context"
	"os"
	"time"
)

// ComplexStruct contains multiple imported types
type ComplexStruct struct {
	Ctx     context.Context
	Mode    os.FileMode
	File    *os.File
	Timer   *time.Timer
	Created time.Time
}

// NestedStruct has fields with imported types in nested scenarios
type NestedStruct struct {
	Complex ComplexStruct
	Times   []time.Time
	Files   []*os.File
}

func main() {
	// Create complex structures
	complex := ComplexStruct{
		Ctx:     context.Background(),
		Mode:    0755,
		File:    nil,
		Timer:   nil,
		Created: time.Now(),
	}

	nested := NestedStruct{
		Complex: complex,
		Times:   []time.Time{time.Now()},
		Files:   []*os.File{nil},
	}

	println("Complex mode:", int(complex.Mode))
	println("Nested has complex:", nested.Complex.Mode != 0)
	println("Times length:", len(nested.Times))
	println("Files length:", len(nested.Files))
}
