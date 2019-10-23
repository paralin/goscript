# GoScript

[![GoDoc Widget]][GoDoc] [![Go Report Card Widget]][Go Report Card]

[GoDoc]: https://godoc.org/github.com/paralin/goscript
[GoDoc Widget]: https://godoc.org/github.com/paralin/goscript?status.svg
[Go Report Card Widget]: https://goreportcard.com/badge/github.com/paralin/goscript
[Go Report Card]: https://goreportcard.com/report/github.com/paralin/goscript

## Introduction

GoScript is a Go to TypeScript compiler. It allows Go programs to run in the
browser after being checked and optimized by the TypeScript compiler.

It's currently an experimental project, and not ready for production.

## Generated Code

Below is a simple example of how code is generated:

```go
package main

import (
	"os"
)

func main() {
	os.Stdout.WriteString("Hello world!\n")
}
```

Generated with `goscript compile .`:

```typescript
import * as os from "@go/os";
function main() {
	os.Stdout.WriteString("Hello world!\n");
}
```

Code is compiled with `GOARCH=js`. Code designed to work with `syscall/js` and
wasm /should/ work correctly with GoScript out of the box.

All Go import paths are prefixed with `@go/` and can be imported in TypeScript:

```typescript
import { MyFunction, MyStruct } from '@go/github.com/myorg/mypackage';

MyFunction();
let myThing = new MyStruct();
myThing.DoSometing();
```

Go structs are converted into classes.

## Roadmap

 - [ ] Sample programs compile & run
 - [ ] Generate init() function to recursively initialize packages
 - [ ] Tooling to integrate with typescript compiler
 - [ ] "go test" implementation with Go -> Ts transformation
 - [ ] performance testing
 - [ ] examples of calling Go code from TypeScript

At the moment, some of the Go ast is not implemented. This work will be
completed first before tackling the above features.

