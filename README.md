# GoScript

[![GoDoc Widget]][GoDoc] [![Go Report Card Widget]][Go Report Card]

[GoDoc]: https://godoc.org/github.com/paralin/goscript
[GoDoc Widget]: https://godoc.org/github.com/paralin/goscript?status.svg
[Go Report Card Widget]: https://goreportcard.com/badge/github.com/paralin/goscript
[Go Report Card]: https://goreportcard.com/report/github.com/paralin/goscript

## Introduction

GoScript is a Go to TypeScript compiler / translater.

It works on translating Go to TypeScript on the AST level.

For detailed information on the compiler's design, refer to the [design document](./design/DESIGN.md).

GoScript intends to compile a subset of the Go language to TypeScript in a
non-spec-compliant way. It is intended only for bringing over high-level logic
from Go to TypeScript, so not all programs will work correctly:

- Numbers (ints) use the "number" type in JavaScript is different than Go int32.
- Pointer arithmetic (uintptr) and unsafe are not supported
- Reflection is not supported

If you want to guarantee your program runs exactly the same in the browser as
natively, you should instead use wasm or gopherjs.

It's currently an experimental project, and not ready for production.


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

Check [the compliance tests](./compliance/COMPLIANCE.md) for implementation progress.

 - [X] Simple programs compile & run
 - [ ] Compliance for basic language features complete
 - [ ] Function coloring and async logic
 - [ ] Work our way up to more complex programs
 - [ ] Generate init() function to recursively initialize packages
 - [ ] Tooling to integrate with typescript compiler
 - [ ] "go test" implementation with Go -> Ts transformation
    - vitest
 - [ ] performance testing
 - [ ] examples of calling Go code from TypeScript


## Generated Code

Below is a simple example of how code is generated:

```go
package main

// MyStruct demonstrates a simple struct with public and private fields.
// It will be converted into a TypeScript class by goscript.
type MyStruct struct {
  // MyInt is a public integer field, initialized to zero.
  MyInt int
  // MyString is a public string field, initialized to empty string.
  MyString string
  // myBool is a private boolean field, initialized to false.
  myBool bool
}

// GetMyString returns the MyString field.
func (m *MyStruct) GetMyString() string {
  return m.MyString
}

// GetMyBool returns the myBool field.
func (m *MyStruct) GetMyBool() bool {
  return m.myBool
}

// NewMyStruct creates a new MyStruct instance.
func NewMyStruct(s string) MyStruct {
  return MyStruct{MyString: s}
}

func vals() (int, int) {
  return 1, 2
}

func main() {
  println("Hello from GoScript example!")

  // Basic arithmetic
  a, b := 10, 3
  println("Addition:", a+b, "Subtraction:", a-b, "Multiplication:", a*b, "Division:", a/b, "Modulo:", a%b)

  // Boolean logic and comparisons
  println("Logic &&:", true && false, "||:", true || false, "!:!", !true)
  println("Comparisons:", a == b, a != b, a < b, a > b, a <= b, a >= b)

  // string(rune) conversion
  var r rune = 'X'
  s := string(r)
  println("string('X'):", s)

  var r2 rune = 121 // 'y'
  s2 := string(r2)
  println("string(121):", s2)

  var r3 rune = 0x221A // '√'
  s3 := string(r3)
  println("string(0x221A):", s3)

  // Arrays
  arr := [3]int{1, 2, 3}
  println("Array elements:", arr[0], arr[1], arr[2])

  // Slices and range loop
  slice := []int{4, 5, 6}
  println("Slice elements:", slice[0], slice[1], slice[2])
  sum := 0
  for idx, val := range slice {
    sum += val
    println("Range idx:", idx, "val:", val)
  }
  println("Range sum:", sum)

  // Basic for loop
  prod := 1
  for i := 1; i <= 3; i++ {
    prod *= i
  }
  println("Product via for:", prod)

  // Struct, pointers, copy independence
  instance := NewMyStruct("go-script")
  println("instance.MyString:", instance.GetMyString())
  instance.MyInt = 42
  copyInst := instance
  copyInst.MyInt = 7
  println("instance.MyInt:", instance.MyInt, "copyInst.MyInt:", copyInst.MyInt)

  // Pointer initialization and dereference assignment
  ptr := new(MyStruct)
  ptr.MyInt = 9
  println("ptr.MyInt:", ptr.MyInt)
  deref := *ptr
  deref.MyInt = 8
  println("After deref assign, ptr.MyInt:", ptr.MyInt, "deref.MyInt:", deref.MyInt)

  // Method calls on pointer receiver
  ptr.myBool = true
  println("ptr.GetMyBool():", ptr.GetMyBool())

  // Composite literal assignment
  comp := MyStruct{MyInt: 100, MyString: "composite", myBool: false}
  println("comp fields:", comp.MyInt, comp.GetMyString(), comp.GetMyBool())

  // Multiple return values and blank identifier
  x, _ := vals()
  _, y := vals()
  println("vals x:", x, "y:", y)

  // If/else
  if a > b {
    println("If branch: a>b")
  } else {
    println("Else branch: a<=b")
  }

  // Switch statement
  switch a {
  case 10:
    println("Switch case 10")
  default:
    println("Switch default")
  }
}
```

Generated with `goscript compile .`:

```typescript
import * as goscript from "@go/builtin";

class MyStruct {
  // MyInt is a public integer field, initialized to zero.
  public MyInt: number = 0;
  // MyString is a public string field, initialized to empty string.
  public MyString: string = "";
  // myBool is a private boolean field, initialized to false.
  private myBool: boolean = false;

  // GetMyString returns the MyString field.
  public GetMyString(): string {
    const m = this
    return m.MyString
  }

  // GetMyBool returns the myBool field.
  public GetMyBool(): boolean {
    const m = this
    return m.myBool
  }

  constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any); }
  public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this); }
}

// NewMyStruct creates a new MyStruct instance.
export function NewMyStruct(s: string): MyStruct {
  return new MyStruct({ MyString: s })
}

function vals(): [number, number] {
  return [1, 2]
}

export function main(): void {
  console.log("Hello from GoScript example!")

  // Basic arithmetic
  let a = 10
  let b = 3
  console.log("Addition:", a + b, "Subtraction:", a - b, "Multiplication:", a * b, "Division:", a / b, "Modulo:", a % b)

  // Boolean logic and comparisons
  console.log("Logic &&:", true && false, "||:", true || false, "!:!", !true)
  console.log("Comparisons:", a == b, a != b, a < b, a > b, a <= b, a >= b)

  // string(rune) conversion
  let r: number = 'X';
  let s = String.fromCharCode(r)
  console.log("string('X'):", s)

  // 'y'
  let r2: number = 121;
  let s2 = String.fromCharCode(r2)
  console.log("string(121):", s2)

  // '√'
  let r3: number = 0x221A;
  let s3 = String.fromCharCode(r3)
  console.log("string(0x221A):", s3)

  // Arrays
  let arr = [1, 2, 3]
  console.log("Array elements:", arr[0], arr[1], arr[2])

  // Slices and range loop
  let slice = [4, 5, 6]
  console.log("Slice elements:", slice[0], slice[1], slice[2])
  let sum = 0
  for (let idx = 0; idx < slice.length; idx++) {
    const val = slice[idx]
    {
      sum += val
      console.log("Range idx:", idx, "val:", val)
    }
  }
  console.log("Range sum:", sum)

  // Basic for loop
  let prod = 1
  for (let i = 1; i <= 3; i++) {
    prod *= i
  }
  console.log("Product via for:", prod)

  // Struct, pointers, copy independence
  let instance = NewMyStruct("go-script").clone()
  console.log("instance.MyString:", instance.GetMyString())
  instance.MyInt = 42
  let copyInst = instance.clone()
  copyInst.MyInt = 7
  console.log("instance.MyInt:", instance.MyInt, "copyInst.MyInt:", copyInst.MyInt)

  // Pointer initialization and dereference assignment
  let ptr = new(MyStruct)
  ptr.MyInt = 9
  console.log("ptr.MyInt:", ptr.MyInt)
  let deref = ptr.clone()
  deref.MyInt = 8
  console.log("After deref assign, ptr.MyInt:", ptr.MyInt, "deref.MyInt:", deref.MyInt)

  // Method calls on pointer receiver
  ptr.myBool = true
  console.log("ptr.GetMyBool():", ptr.GetMyBool())

  // Composite literal assignment
  let comp = new MyStruct({ MyInt: 100, MyString: "composite", myBool: false }).clone()
  console.log("comp fields:", comp.MyInt, comp.GetMyString(), comp.GetMyBool())

  // Multiple return values and blank identifier
  let [x, ] = vals()
  let [, y] = vals()
  console.log("vals x:", x, "y:", y)

  // If/else
  if (a > b) {
    console.log("If branch: a>b")
  } else {
    console.log("Else branch: a<=b")
  }

  // Switch statement
  switch (a) {
    case 10:
      console.log("Switch case 10")
      break
    default:
      console.log("Switch default")
      break
  }
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

## License

MIT