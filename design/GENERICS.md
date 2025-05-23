# GoScript Generics Design

## Introduction

This document outlines the approach for translating Go generics (introduced in Go 1.18) to TypeScript. Both Go and TypeScript support parametric polymorphism via generics, making the translation conceptually straightforward but with several important details to consider.

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

### Generic Structs

Generic structs are translated to TypeScript classes with type parameters. The compiler properly handles:

- Type parameter declaration on the class
- Generic methods with proper receiver handling
- Type-aware clone methods and constructors

```go
// Go
type Pair[T any] struct {
    First, Second T
}

func (p Pair[T]) GetFirst() T {
    return p.First
}

func (p Pair[T]) Swap() Pair[T] {
    return Pair[T]{p.Second, p.First}
}
```

```typescript
// TypeScript
class Pair<T extends any> {
    public get First(): T { /* ... */ }
    public set First(value: T) { /* ... */ }
    public get Second(): T { /* ... */ }
    public set Second(value: T) { /* ... */ }
    
    constructor(init?: Partial<{ First?: T, Second?: T }>) {
        // Initialization logic
    }
    
    public clone(): Pair<T> {
        const cloned = new Pair<T>()
        // Clone logic
        return cloned
    }
    
    public GetFirst(): T {
        const p = this
        return p.First
    }
    
    public Swap(): Pair<T> {
        return new Pair<T>({ First: this.Second, Second: this.First })
    }
    
    // Runtime type registration
    static __typeInfo = $.registerStructType(
        'Pair',
        new Pair(),
        // Method signatures and field information
    );
}
```

### Method Resolution for Generic Types

The compiler correctly identifies methods defined on generic struct receivers, handling both simple identifiers (`Pair`) and indexed expressions (`Pair[T]`) when parsing method receivers.

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

### Return Type Handling

For generic functions that return instantiated generic types, the compiler includes the complete type with type arguments:

```go
// Go
func makePair[T any](a, b T) Pair[T] {
    return Pair[T]{First: a, Second: b}
}
```

```typescript
// TypeScript
function makePair<T extends any>(a: T, b: T): Pair<T> {
    return new Pair<T>({First: a, Second: b})
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

## Advanced Constraints: Union Types

Go 1.18 introduced type sets via the `|` operator in interfaces. These are translated to TypeScript union types:

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
type Number = number | bigint

function Sum<T extends Number>(values: T[]): T {
    let result = 0 as T
    for (let i = 0; i < values.length; i++) {
        result = $.add(result, values[i]) as T
    }
    return result
}
```

### Direct Union Constraints

Go allows type parameters to be constrained by a union of types directly:

```go
// Go
func getLength[S string | []byte](s S) int {
    return len(s)
}

func leadingInt[bytes ~[]byte | ~string](s bytes) (x int, rem bytes, err bool) {
    var i int
    for i < len(s) {
        c := s[i]
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
function getLength<S extends string | Uint8Array>(s: S): number {
    return $.len(s)
}

function leadingInt<bytes extends Uint8Array | string>(s: bytes): [number, bytes, boolean] {
    let x: number = 0
    let i = 0
    for (; i < $.len(s); i++) {
        let c = $.indexStringOrBytes(s, i)
        if (c < 48 || c > 57) {
            break
        }
        x = x * 10 + (c as number) - 48
    }
    return [x, $.sliceStringOrBytes(s, i, undefined), false]
}
```

## Runtime Support

### Specialized Helpers for Union-Constrained Operations

When a type parameter is constrained by a union of types (e.g., `S string | []byte`), common operations require specialized runtime helpers to ensure consistent Go semantics:

| Operation | Go Code | TypeScript Helper | Return Type |
|-----------|---------|-------------------|-------------|
| Length | `len(s)` | `$.len(s)` | `number` |
| Indexing | `s[i]` | `$.indexStringOrBytes(s, i)` | `number` (byte value) |
| Slicing | `s[i:j]` | `$.sliceStringOrBytes(s, i, j)` | Same as input type |
| String conversion | `string(s)` | `$.genericBytesOrStringToString(s)` | `string` |

### Type Constraint Interfaces

The `@goscript/builtin` module provides interfaces for Go's built-in type constraints:

```typescript
// Comparable interface for Go's comparable constraint
export interface Comparable {
  // Marker interface for types that can be compared with == and !=
}
```

## Operator Handling

Go's operators in generic contexts require runtime helpers in TypeScript to maintain correct semantics:

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

## Type Registration and Runtime Support

Generic struct types are registered with the runtime type system using their base names (without type parameters) to avoid TypeScript's restriction on type parameters in static contexts:

```typescript
class Pair<T extends any> {
    // ... class implementation
    
    static __typeInfo = $.registerStructType(
        'Pair',                    // Base name
        new Pair(),               // Zero value (no type params)
        // Method signatures and field information
    );
}
```

### Method Resolution for Generic Types

The compiler correctly identifies methods defined on generic struct receivers, handling both simple identifiers (`Pair`) and indexed expressions (`Pair[T]`) when parsing method receivers.

### Generic Interfaces

Generic interfaces are translated to TypeScript interface types with type parameters. The compiler properly handles:

- Type parameter declaration on the interface type
- Method signatures using type parameters  
- Runtime type registration with method metadata

```go
// Go
type Container[T any] interface {
    Get() T
    Set(T)
    Size() int
}

type Comparable[T comparable] interface {
    Compare(T) int
    Equal(T) bool
}
```

```typescript
// TypeScript
type Container<T extends any> = null | {
    Get(): T
    Set(_p0: T): void
    Size(): number
}

type Comparable<T extends $.Comparable> = null | {
    Compare(_p0: T): number
    Equal(_p0: T): boolean
}

// Runtime registration follows the same pattern as non-generic interfaces
$.registerInterfaceType(
  'Container',
  null, // Zero value for interface is null
  [/* method signatures */]
);
```

#### Implementation Details for Generic Interfaces

The compiler handles generic interfaces through:

1. **Type Parameter Processing**: The `WriteInterfaceTypeSpec` function includes type parameter handling using the same mechanism as generic structs
2. **Method Translation**: Type parameters in method signatures are preserved in the TypeScript interface structure
3. **Runtime Registration**: Interface types are registered using their base name (without type parameters) for runtime type checking

Functions can use generic interfaces as constraints and parameter types:

```go
// Go
func useContainer[T any](c Container[T], val T) T {
    c.Set(val)
    return c.Get()
}
```

```typescript
// TypeScript  
function useContainer<T extends any>(c: Container<T>, val: T): T {
    c!.Set(val)
    return c!.Get()
}
```
