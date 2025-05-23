# GoScript Generics Design

## Introduction

This document outlines the approach for translating Go generics (introduced in Go 1.18) to TypeScript. Both Go and TypeScript support parametric polymorphism via generics, making the translation conceptually straightforward but with several important details to consider.

**Status**: Generics support has been successfully implemented and tested. The `generics_leading_int` compliance test passes with correct output matching Go behavior.

## Type Parameters and Constraints

### Basic Translation

Go's type parameters and their constraints are translated to TypeScript's generic type parameters. The mapping is direct for most cases:

```go
// Go
func Min[T constraints.Ordered](a, b T) T {
    if a < b {
        return a
    }
    return b
}
```

```typescript
// TypeScript
function Min<T extends $.Ordered>(a: T, b: T): T {
    if ($.less(a, b)) {
        return a
    }
    return b
}
```

### Type Parameter Names and Zero Values

In the TypeScript translation:
- **Type annotations**: Type parameters are written as their names (e.g., `T`, `bytes`)
- **Zero values**: Type parameters use `null!` (non-null assertion) to avoid TypeScript casting errors with union types

```go
// Go
func example[T any]() T {
    var x T  // Zero value of T
    return x
}
```

```typescript
// TypeScript  
function example<T>(): T {
    let x: T = null!  // Proper zero value for type parameters
    return x
}
```

### Constraint Translation

Go's type constraints map to TypeScript's `extends` clause:

1. **Interface Constraints**: Directly translated to TypeScript interfaces
2. **Type Sets**: Approximated using union types or helper interfaces
3. **Built-in Constraints**: Mapped to runtime helpers in the `@goscript/builtin` package

| Go Constraint | TypeScript Equivalent |
|---------------|------------------------|
| `any`         | `any` |
| `comparable`  | `$.Comparable` |
| `constraints.Ordered` | `$.Ordered` |

## Generic Types

Generic structs, interfaces, and type aliases are translated to their TypeScript counterparts:

```go
// Go
type Pair[T any] struct {
    First, Second T
}

func (p Pair[T]) Swap() Pair[T] {
    return Pair[T]{p.Second, p.First}
}
```

```typescript
// TypeScript
class Pair<T> {
    public First: T
    public Second: T
    
    constructor(init?: { First?: T, Second?: T }) {
        this._fields = {
            First: $.box(init?.First ?? null),
            Second: $.box(init?.Second ?? null)
        }
    }
    
    public Swap(): Pair<T> {
        return new Pair<T>({ First: this.Second, Second: this.First })
    }
    
    // ... other generated code (clone, etc.)
}
```

## Generic Functions

Go generic functions compile to TypeScript generic functions, preserving the type parameters and their constraints:

```go
// Go
func Map[T, U any](s []T, f func(T) U) []U {
    r := make([]U, len(s))
    for i, v := range s {
        r[i] = f(v)
    }
    return r
}
```

```typescript
// TypeScript
function Map<T, U>(s: T[], f: (v: T) => U): U[] {
    const r = $.makeSlice<U>($.len(s))
    for (let i = 0; i < $.len(s); i++) {
        r[i] = f(s[i])
    }
    return r
}
```

## Type Inference

Both Go and TypeScript support type parameter inference, allowing generic functions to be called without explicitly specifying type arguments:

```go
// Go
result := Map([]int{1, 2, 3}, func(x int) string {
    return strconv.Itoa(x)
})
```

```typescript
// TypeScript
const result = Map([1, 2, 3], (x: number) => x.toString())
```

TypeScript's type inference rules are generally compatible with Go's, simplifying the translation.

## Advanced Constraints: Type Sets

Go 1.18 introduced type sets via the `|` operator in interfaces. We translate these to TypeScript union types:

```go
// Go
type Number interface {
    int | float64
}

func Sum[T Number](values []T) T {
    var result T
    for _, v := range values {
        result += v
    }
    return result
}
```

```typescript
// TypeScript
type Number = number | bigint // Simplified since both map to number/bigint

function Sum<T extends Number>(values: T[]): T {
    let result = 0 as T // Initialize with proper zero value
    for (let i = 0; i < values.length; i++) {
        result = $.add(result, values[i]) as T
    }
    return result
}
```

Go also allows type parameters to be constrained by a union of types directly, without needing an intermediate interface. This provides a more concise way to define constraints for simple unions.

```go
// Go
// A type parameter S constrained to be either a string or a byte slice.
func getLength[S string | []byte](s S) int {
    return len(s) // len() works polymorphicly in Go for string and []byte
}

// Indexing a value that could be a string or a byte slice.
func getFirstElementCode[S string | []byte](s S) int {
    if len(s) == 0 {
        return -1
    }
    // In Go, s[0] would give a byte for both.
    return int(s[0])
}

// Real-world example: leadingInt parses leading digits from string or []byte
func leadingInt[bytes ~[]byte | ~string](s bytes) (x int, rem bytes, err bool) {
    var i int
    for i < len(s) {
        c := s[i]  // Gets byte value for both string and []byte
        if c < '0' || c > '9' {
            break
        }
        x = x*10 + int(c-'0')
        i++
    }
    return x, s[i:], false
}
```

```typescript
// TypeScript
// The union constraint translates directly.
function getLength<S extends string | Uint8Array>(s: S): number {
    return $.len(s); // Uses a runtime helper for consistent behavior
}

// For operations like indexing, specialized helpers ensure correct typing.
function getFirstElementCode<S extends string | Uint8Array>(s: S): number {
    if ($.len(s) === 0) {
        return -1;
    }
    // $.indexStringOrBytes() handles both string (byte access) and Uint8Array
    return $.indexStringOrBytes(s, 0);
}

// Real-world working example from generics_leading_int test
function leadingInt<bytes extends Uint8Array | string>(s: bytes): [number, bytes, boolean] {
    let x: number = 0
    let rem: bytes = null!
    let err: boolean = false
    {
        let i = 0
        for (; i < $.len(s); i++) {
            let c = $.indexStringOrBytes(s, i)  // Returns number (byte value)
            if (c < 48 || c > 57) {
                break
            }
            x = x * 10 + (c as number) - 48
        }
        return [x, $.sliceStringOrBytes(s, i, undefined), false]
    }
}
```

## Implementation Challenges

### Operator Constraints

Go's operators in generic contexts (like `+`, `<`, etc. on generic types) require runtime helpers in TypeScript:

```go
// Go
func Add[T constraints.Integer](a, b T) T {
    return a + b
}
```

```typescript
// TypeScript
function Add<T extends $.Integer>(a: T, b: T): T {
    return $.add(a, b) as T
}
```

The `$.add` helper handles correct addition semantics for different numeric types.

### Operations on Union-Constrained Type Parameters

When a type parameter is constrained by a union of types (e.g., `S string | []byte`), common operations like indexing (`s[i]`), slicing (`s[i:j]`), or getting length (`len(s)`) require special attention. While these operations might be polymorphic in Go for certain built-in types (like `string` and `[]byte`), TypeScript often lacks direct polymorphic equivalents that produce the exact Go semantics across the union.

To bridge this gap and ensure consistent Go semantics, GoScript provides specialized helper functions in the `@goscript/builtin` module:

#### Available Specialized Helpers

| Operation | Go Code | TypeScript Helper | Return Type |
|-----------|---------|-------------------|-------------|
| Length | `len(s)` | `$.len(s)` | `number` |
| Indexing | `s[i]` | `$.indexStringOrBytes(s, i)` | `number` (byte value) |
| Slicing | `s[i:j]` | `$.sliceStringOrBytes(s, i, j)` | Same as input type |
| String conversion | `string(s)` | `$.genericBytesOrStringToString(s)` | `string` |

#### Implementation Details

The compiler recognizes when an operation is performed on a type parameter with a `string | []byte` constraint and automatically substitutes the appropriate runtime helper:

```go
// Go - compiler detects union-constrained type parameter operations
func process[S string | []byte](s S) {
    length := len(s)     // Compiled to: $.len(s)
    first := s[0]        // Compiled to: $.indexStringOrBytes(s, 0)  
    slice := s[1:3]      // Compiled to: $.sliceStringOrBytes(s, 1, 3)
}
```

```typescript
// TypeScript - generated with proper helpers
function process<S extends string | Uint8Array>(s: S): void {
    const length = $.len(s)
    const first = $.indexStringOrBytes(s, 0)
    const slice = $.sliceStringOrBytes(s, 1, 3)
}
```

This approach ensures that:
1. **Type Safety**: TypeScript gets correct type information
2. **Runtime Correctness**: Operations behave consistently with Go semantics  
3. **Performance**: Direct operations when possible, helpers only when needed

### Type Approximation

Some Go type constraints can't be precisely expressed in TypeScript's type system. In these cases, we use runtime checks or type approximations.

### Method Constraints

Go allows constraining types based on methods they implement. This is handled using TypeScript interfaces:

```go
// Go
type Stringer interface {
    String() string
}

func Print[T Stringer](v T) {
    fmt.Println(v.String())
}
```

```typescript
// TypeScript
interface Stringer {
    String(): string
}

function Print<T extends Stringer>(v: T): void {
    console.log(v.String())
}
```

## Special Cases

### Instantiated Types

Go allows instantiating generic types with concrete type arguments (e.g., `MyMap[string, int]`). In TypeScript, this is directly supported using similar syntax.

### Type Parameter Inference with Context

TypeScript and Go have slightly different rules for inferring type arguments from context. The compiler adapts Go's rules to TypeScript's capabilities.

## Conclusion

The translation of Go generics to TypeScript has been successfully implemented, leveraging the similarities between both type systems while accounting for differences in operator behavior and constraint semantics. 

### Implementation Status

✅ **Completed Features:**
- Type parameter translation and constraint handling
- Generic function compilation with proper type inference
- Union-constrained type parameters (`string | []byte`)
- Specialized runtime helpers for common operations
- Zero value handling for type parameters
- Full compilation pipeline with TypeScript type checking

✅ **Working Examples:**
- The `generics_leading_int` compliance test passes completely
- Generates clean, type-safe TypeScript code
- Runtime behavior matches Go semantics exactly

### Key Implementation Details

1. **Type Parameters**: Translated as TypeScript generic parameters with proper constraint mapping
2. **Zero Values**: Use `null!` for type parameters to avoid TypeScript casting errors
3. **Union Operations**: Specialized helpers like `$.indexStringOrBytes()` ensure correct typing and behavior
4. **Compiler Intelligence**: Automatic detection and substitution of union-constrained operations

The `@goscript/builtin` runtime provides the necessary helper functions and interfaces to ensure correct semantics for operations on generic types, making Go generics fully usable in the TypeScript target environment.
