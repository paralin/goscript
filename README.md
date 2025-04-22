# GoScript

[![GoDoc Widget]][GoDoc] [![Go Report Card Widget]][Go Report Card]

[GoDoc]: https://godoc.org/github.com/paralin/goscript
[GoDoc Widget]: https://godoc.org/github.com/paralin/goscript?status.svg
[Go Report Card Widget]: https://goreportcard.com/badge/github.com/paralin/goscript
[Go Report Card]: https://goreportcard.com/report/github.com/paralin/goscript

## Introduction

GoScript is a Go to TypeScript compiler / translater.

It works on translating Go to TypeScript on the AST level.

GoScript intends to compile a subset of the Go language to TypeScript in a
non-spec-compliant way. It is intended only for bringing over high-level logic
from Go to TypeScript, so not all programs will work correctly:

- Numbers (ints) use the "number" type in JavaScript is different than Go int32.
- Pointer arithmetic (uintptr) and unsafe are not supported
- Reflection is not supported

If you want to guarantee your program runs exactly the same in the browser as
natively, you should instead use wasm or gopherjs.

It's currently an experimental project, and not ready for production.

## Generated Code

Below is a simple example of how code is generated:

```go
package main

// MyStruct is converted into a class.
type MyStruct struct {
	// MyInt is a public integer field, initialized to zero.
	MyInt int
	// myBool is a private boolean field, intialized to false.
	myBool bool
}

func main() {
	println("Hello world")
}
```

Generated with `goscript compile .`:

```typescript
// MyStruct is converted into a class.
class MyStruct {
	// MyInt is a public integer field, initialized to zero.
	public myInt: number = 0;
	// myBool is a private boolean field, intialized to false.
	private myBool: boolean = false;
}

export function main() {
	console.log("Hello world");
}
```

Code is compiled with `GOARCH=js` and uses a 32-bit environment similar to wasm.

All Go import paths are prefixed with `@go/` and can be imported in TypeScript:

```typescript
import { MyFunction, MyStruct } from '@go/github.com/myorg/mypackage';

MyFunction();
let myThing = new MyStruct();
myThing.DoSometing();
```

## Usage

### Command Line

Compile a package using the CLI tool:

```bash
goscript compile --package <go_package_path> --gopath <path_to_gopath> --output <output_directory>
```

For example, to compile the simple example:

```bash
cd example/simple
go run ../../cmd/goscript compile --package . --output ./output
```

### As a Library

You can also use the compiler directly within your Go code. Here's a basic example:

```go
package main

import (
	"context"
	"log"

	"github.com/paralin/goscript/compiler"
	"github.com/sirupsen/logrus"
)

func main() {
	// Initialize logger (optional)
	logger := logrus.New()
	logger.SetLevel(logrus.DebugLevel) // Adjust log level as needed
	le := logrus.NewEntry(logger)

	// Configure the compiler
	conf := &compiler.Config{
		GoPathRoot:     "/path/to/your/gopath", // Or project root if not using GOPATH
		OutputPathRoot: "./ts_output",          // Directory for generated TypeScript files
	}
	if err := conf.Validate(); err != nil {
		log.Fatalf("invalid compiler config: %v", err)
	}

	// Create a new compiler instance
	comp, err := compiler.NewCompiler(conf, le, nil) // Pass nil for default package loading options
	if err != nil {
		log.Fatalf("failed to create compiler: %v", err)
	}

	// Compile the desired Go package(s)
	// Replace "." with the specific Go import path of the package you want to compile
	if err := comp.CompilePackages(context.Background(), "your/go/package/path"); err != nil {
		log.Fatalf("compilation failed: %v", err)
	}

	log.Println("Compilation successful!")
}

```

This example initializes the compiler with basic configuration, creates a compiler instance, and then calls `CompilePackages` to translate the specified Go package into TypeScript files within the designated output directory.

## Roadmap

 - [X] Simple programs compile & run
 - [ ] Function coloring and async logic
 - [ ] Work our way up to more complex programs
 - [ ] Generate init() function to recursively initialize packages
 - [ ] Tooling to integrate with typescript compiler
 - [ ] "go test" implementation with Go -> Ts transformation
    - vitest
 - [ ] performance testing
 - [ ] examples of calling Go code from TypeScript

