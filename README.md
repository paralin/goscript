# GoScript

[![GoDoc Widget]][GoDoc] [![Go Report Card Widget]][Go Report Card] [![DeepWiki Widget]][DeepWiki]

[GoDoc]: https://godoc.org/github.com/aperturerobotics/goscript
[GoDoc Widget]: https://godoc.org/github.com/aperturerobotics/goscript?status.svg
[Go Report Card Widget]: https://goreportcard.com/badge/github.com/aperturerobotics/goscript
[Go Report Card]: https://goreportcard.com/report/github.com/aperturerobotics/goscript
[DeepWiki Widget]: https://img.shields.io/badge/DeepWiki-aperturerobotics%2Fgoscript-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==
[DeepWiki]: https://deepwiki.com/aperturerobotics/goscript

## Introduction

GoScript is a Go to TypeScript compiler / translater.

It works on translating Go to TypeScript on the AST level.

For detailed information on the compiler's design, refer to the [design document](./design/DESIGN.md).

> Right now goscript looks pretty cool if you problem is "I want this self-sufficient algorithm be available in Go and JS runtimes". gopherjs's ambition, however, has always been "any valid Go program can run in a browser". There is a lot that goes on in gopherjs that is necessary for supporting the standard library, which goes beyond cross-language translation.
>
> &mdash; [nevkontakte](https://gophers.slack.com/archives/C039C0R2T/p1745870396945719), developer of [GopherJS](https://github.com/gopherjs/gopherjs)

GoScript intends to compile a subset of the Go language to TypeScript in a
non-spec-compliant way. It is intended only for bringing over high-level logic
from Go to TypeScript, so not all programs will work correctly:

- Numbers (ints) use the "number" type in JavaScript is different than Go int32.
- Pointer arithmetic (uintptr) and unsafe are not supported
- Reflection is not supported
- Complex numbers are not supported

If you are OK with these limitations, GoScript is for you!

## Usage

### Command Line

After installing the `goscript` npm package, the `goscript` command line tool is available. You can run it directly or within your `package.json` scripts.

Compile a package using the CLI tool:

```bash
goscript compile \
  --package "my/package" \
  --output ./output
```

For example, to compile the simple example from the project root:

```bash
goscript compile --package ./example/simple --output ./output
```
Or within the `example/simple` directory:

```bash
cd example/simple
goscript compile --package . --output ./output
```

### As a Library

You can also use the compiler directly within your Go code. Here's a basic example:

```go
package main

import (
    "context"
    "log"

    "github.com/aperturerobotics/goscript/compiler"
    "github.com/sirupsen/logrus"
)

func main() {
    // Initialize logger (optional)
    logger := logrus.New()
    logger.SetLevel(logrus.DebugLevel) // Adjust log level as needed
    le := logrus.NewEntry(logger)

    // Configure the compiler
    conf := &compiler.Config{
        OutputPath: "./ts_output",          // Directory for generated TypeScript files
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
    if _, err := comp.CompilePackages(context.Background(), "your/go/package/path"); err != nil {
        log.Fatalf("compilation failed: %v", err)
    }

    log.Println("Compilation successful!")
}

```

This example initializes the compiler, creates a compiler instance, and then calls `CompilePackages` to translate the specified Go package into TypeScript files in the output directory.

### TypeScript API

You can also use GoScript programmatically within your Node.js projects.

**Installation:**

```bash
npm install goscript
# or
yarn add goscript
```

**Usage:**

```typescript
import { compile } from 'goscript';
import * as path from 'path';

async function runCompilation() {
  const exampleDir = path.resolve(__dirname, 'path/to/your/go/project'); // Adjust path accordingly
  const outputDir = path.join(exampleDir, 'ts_output');

  try {
    await compile({
      pkg: '.', // Compile the package in the exampleDir
      dir: exampleDir,
      output: outputDir,
      // Optional: specify path to goscript CLI if not in PATH or using go run
      // goscriptPath: '/path/to/goscript/executable'
    });
    console.log(`Compilation successful! Output in ${outputDir}`);
  } catch (error) {
    console.error('Compilation failed:', error);
  }
}

runCompilation();
```

This example imports the `compile` function, configures it to compile a Go package located in `exampleDir`, and outputs the TypeScript files to `outputDir`.

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

  // Slices - Basic initialization and access
  slice := []int{4, 5, 6}
  println("Slice elements:", slice[0], slice[1], slice[2])
  println("Slice length:", len(slice), "capacity:", cap(slice))
  
  sliceWithCap := make([]int, 3, 5)
  println("\nSlice created with make([]int, 3, 5):")
  println("Length:", len(sliceWithCap), "Capacity:", cap(sliceWithCap))
  
  println("\nAppend and capacity growth:")
  growingSlice := make([]int, 0, 2)
  println("Initial - Length:", len(growingSlice), "Capacity:", cap(growingSlice))
  
  for i := 1; i <= 4; i++ {
    growingSlice = append(growingSlice, i)
    println("After append", i, "- Length:", len(growingSlice), "Capacity:", cap(growingSlice))
  }
  
  println("\nSlicing operations and shared backing arrays:")
  original := []int{10, 20, 30, 40, 50}
  println("Original slice - Length:", len(original), "Capacity:", cap(original))
  
  slice1 := original[1:3]
  println("slice1 := original[1:3] - Values:", slice1[0], slice1[1])
  println("slice1 - Length:", len(slice1), "Capacity:", cap(slice1))
  
  slice2 := original[1:3:4]
  println("slice2 := original[1:3:4] - Values:", slice2[0], slice2[1])
  println("slice2 - Length:", len(slice2), "Capacity:", cap(slice2))
  
  println("\nShared backing arrays:")
  slice1[0] = 999
  println("After slice1[0] = 999:")
  println("original[1]:", original[1], "slice1[0]:", slice1[0], "slice2[0]:", slice2[0])
  
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

  // Goroutines and Channels
  println("\nGoroutines and Channels:")
  ch := make(chan string)
  go func() {
    println("Goroutine: Sending message")
    ch <- "Hello from goroutine!"
  }()

  msg := <-ch
  println("Main goroutine: Received message:", msg)

  // Select statement
  println("\nSelect statement:")
  selectCh := make(chan string)
  go func() {
    selectCh <- "Message from select goroutine!"
  }()
  anotherCh := make(chan string)
  select {
  case selectMsg := <-selectCh:
    println("Select received:", selectMsg)
  case anotherMsg := <-anotherCh: // Add another case
    println("Select received from another channel:", anotherMsg)
  }

  // Function Literals
  println("\nFunction Literals:")
  add := func(x, y int) int {
    return x + y
  }
  sum = add(5, 7)
  println("Function literal result:", sum)
}
```

Generated with `goscript compile .`:

```typescript
import * as $ from "@goscript/builtin"

class MyStruct {
  // MyInt is a public integer field, initialized to zero.
  public MyInt: number = 0
  // MyString is a public string field, initialized to empty string.
  public MyString: string = ""
  // myBool is a private boolean field, initialized to false.
  private myBool: boolean = false

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

  constructor(init?: Partial<MyStruct>) { if (init) Object.assign(this, init as any) }
  public clone(): MyStruct { return Object.assign(Object.create(MyStruct.prototype) as MyStruct, this) }
}

// NewMyStruct creates a new MyStruct instance.
export function NewMyStruct(s: string): MyStruct {
  return new MyStruct({ MyString: s })
}

function vals(): [number, number] {
  return [1, 2]
}

export async function main(): Promise<void> {
  console.log("Hello from GoScript example!")

  // Basic arithmetic
  let a = 10
  let b = 3
  console.log("Addition:", a + b, "Subtraction:", a - b, "Multiplication:", a * b, "Division:", a / b, "Modulo:", a % b)

  // Boolean logic and comparisons
  console.log("Logic &&:", true && false, "||:", true || false, "!:!", !true)
  console.log("Comparisons:", a == b, a != b, a < b, a > b, a <= b, a >= b)

  // string(rune) conversion
  let r: number = 'X'
  let s = String.fromCharCode(r)
  console.log("string('X'):", s)

  // 'y'
  let r2: number = 121
  let s2 = String.fromCharCode(r2)
  console.log("string(121):", s2)

  // '√'
  let r3: number = 0x221A
  let s3 = String.fromCharCode(r3)
  console.log("string(0x221A):", s3)

  // Arrays
  let arr = $.arrayToSlice([1, 2, 3])
  console.log("Array elements:", arr![0], arr![1], arr![2])

  // Slices - Basic initialization and access
  let slice = $.arrayToSlice([4, 5, 6])
  console.log("Slice elements:", slice![0], slice![1], slice![2])
  console.log("Slice length:", $.len(slice), "capacity:", $.cap(slice))

  let sliceWithCap = $.makeSlice<number>(3, 5)
  console.log("\nSlice created with make([]int, 3, 5):")
  console.log("Length:", $.len(sliceWithCap), "Capacity:", $.cap(sliceWithCap))

  console.log("\nAppend and capacity growth:")
  let growingSlice = $.makeSlice<number>(0, 2)
  console.log("Initial - Length:", $.len(growingSlice), "Capacity:", $.cap(growingSlice))

  for (let i = 1; i <= 4; i++) {
    growingSlice = $.append(growingSlice, i)
    console.log("After append", i, "- Length:", $.len(growingSlice), "Capacity:", $.cap(growingSlice))
  }

  console.log("\nSlicing operations and shared backing arrays:")
  let original = $.arrayToSlice([10, 20, 30, 40, 50])
  console.log("Original slice - Length:", $.len(original), "Capacity:", $.cap(original))

  let slice1 = $.goSlice(original, 1, 3)
  console.log("slice1 := original[1:3] - Values:", slice1![0], slice1![1])
  console.log("slice1 - Length:", $.len(slice1), "Capacity:", $.cap(slice1))

  let slice2 = $.goSlice(original, 1, 3, 4)
  console.log("slice2 := original[1:3:4] - Values:", slice2![0], slice2![1])
  console.log("slice2 - Length:", $.len(slice2), "Capacity:", $.cap(slice2))

  console.log("\nShared backing arrays:")
  slice1![0] = 999
  console.log("After slice1[0] = 999:")
  console.log("original[1]:", original![1], "slice1[0]:", slice1![0], "slice2[0]:", slice2![0])

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
  let ptr = new MyStruct()
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

  // Goroutines and Channels
  console.log("\nGoroutines and Channels:")
  let ch = $.makeChannel<string>(0, "")
  queueMicrotask(async () => {
    {
      console.log("Goroutine: Sending message")
      await ch.send("Hello from goroutine!")
    }
  })

  let msg = await ch.receive()
  console.log("Main goroutine: Received message:", msg)

  // Select statement
  console.log("\nSelect statement:")
  let selectCh = $.makeChannel<string>(0, "")
  queueMicrotask(async () => {
    {
      await selectCh.send("Message from select goroutine!")
    }
  })
  let anotherCh = $.makeChannel<string>(0, "")

  // Add another case
  await $.selectStatement([
    {
      id: 0,
      isSend: false,
      channel: selectCh,
      onSelected: async (result) => {
        const selectMsg = result.value
        console.log("Select received:", selectMsg)
      }
    },
    {
      id: 1,
      isSend: false,
      channel: anotherCh,
      onSelected: async (result) => {
        const anotherMsg = result.value
        console.log("Select received from another channel:", anotherMsg)
      }
    },
  ], false)

  // Function Literals
  console.log("\nFunction Literals:")
  let add = (x: number, y: number): number => {
    return x + y
  }
  sum = add(5, 7)
  console.log("Function literal result:", sum)
}
```

Code is compiled with `GOARCH=js` and uses a 32-bit environment similar to wasm.

All Go import paths are prefixed with `@goscript/` and can be imported in TypeScript:

```typescript
import { MyAsyncFunction, MyStruct } from '@goscript/github.com/myorg/mypackage';

// Example of importing and using a compiled Go async function
async function runGoCode() {
  // Call an async function compiled from Go
  const result = await MyAsyncFunction("input data");
  console.log("Result from Go async function:", result);

  // You can still use synchronous types and functions
  let myThing = new MyStruct();
  myThing.GetMyString();
  runGoCode();
}
```

## License

MIT
