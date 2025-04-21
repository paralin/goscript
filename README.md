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

 - [X] Simple programs compile & run
 - [ ] Function coloring and async logic
 - [ ] Work our way up to more complex programs
 - [ ] Generate init() function to recursively initialize packages
 - [ ] Tooling to integrate with typescript compiler
 - [ ] "go test" implementation with Go -> Ts transformation
    - vitest
 - [ ] performance testing
 - [ ] examples of calling Go code from TypeScript

