# GoScript Design Document

## Introduction

GoScript translates Go code to TypeScript. This document outlines the design principles, translation strategies, and known divergences from Go semantics. The goal is to produce idiomatic, readable, and maintainable TypeScript code that preserves the core logic and type safety of the original Go code where possible.

The GoScript runtime, located in `builtin/builtin.ts`, provides necessary helper functions and types (like `int`, `error`, Box types) and is imported in generated code using the `@goscript/builtin` alias.

## Core Principles

1.  **AST Mapping:** Aim for a close mapping between the Go AST (`go/ast`) and the TypeScript AST, simplifying the compiler logic.
2.  **Type Preservation:** Preserve Go's static typing as much as possible using TypeScript's type system.
3.  **Value Semantics:** Emulate Go's value semantics for basic types and structs using copying where necessary. Pointers are used to emulate reference semantics when Go uses pointers. See [Boxes and Pointers](#boxes-and-pointers).
4.  **Idiomatic TypeScript:** Generate TypeScript code that feels natural to TypeScript developers, even if it means minor divergences from exact Go runtime behavior (e.g., `for range` loop variable scoping).
5.  **Readability:** Prioritize clear and understandable generated code.

## Translation Strategies

### Packages and Modules

*   Go packages are translated into TypeScript modules (ES modules).
*   Each Go file within a package is typically translated into a corresponding TypeScript file.
*   The `main` package and `main` function have special handling to produce an executable entry point (details TBD).
*   Imports are translated to TypeScript `import` statements. The GoScript runtime is imported as `@goscript/builtin`.

### Types

*   **Basic Types:** Go basic types (`int`, `string`, `bool`, `float64`, etc.) are mapped to corresponding TypeScript types or custom types provided by the runtime (`@goscript/builtin`).
    *   `int`, `uint`, `int64`, etc. -> `$.int` (currently represented as `number` or `bigint` depending on configuration/needs, potentially using a custom class for overflow checks).
    *   `float64`, `float32` -> `number`
    *   `string` -> `string`
    *   `bool` -> `boolean`
    *   `rune` -> `$.rune` (likely `number`)
    *   `byte` -> `$.byte` (likely `number`)
    *   `error` -> `$.error` (interface, typically `Error | null`)
*   **Composite Types:**
    *   **Structs:** Translated to TypeScript classes. Fields are mapped to class properties. Value semantics are maintained by cloning instances on assignment or passing as arguments, unless pointers are used. See `DESIGN_STRUCTS.md` (TODO: Create this file).
    *   **Arrays:** Translated to TypeScript arrays (`T[]`). Go's fixed-size nature might require runtime checks or specific handling if strictness is needed.
    *   **Slices:** Translated to a custom `$.Slice<T>` type/class from the runtime to handle Go's slice semantics (length, capacity, underlying array).
    *   **Maps:** Translated to TypeScript `Map<K, V>`.
    *   **Channels:** Translated using helper classes/functions from the runtime (`$.Chan<T>`) potentially leveraging async iterators or libraries like `csp-ts`. See `DESIGN_CONCURRENCY.md` (TODO: Create this file).
    *   **Interfaces:** Translated to TypeScript interfaces. Type assertions and type switches require runtime type information or helper functions. See `DESIGN_INTERFACES.md` (TODO: Create this file).

    ### Type Assertions and Type Switches

    Go's type assertion system is translated using runtime type checking with structured type information:

    #### Type Representation

    Types are represented using a structured format:

    ```typescript
    interface TypeInfo {
      kind: TypeKind;            // The base kind (struct, interface, map, slice, etc.)
      name?: string;             // Optional name for named types
      methods?: Set<string>;     // For interfaces: method names
      keyType?: TypeDescription; // For maps: type of keys
      elemType?: TypeDescription; // For maps, slices, arrays, channels: type of elements
      constructor?: Function;    // For structs: constructor function
    }

    type TypeDescription = TypeInfo | string | Function;
    ```

    #### Type Assertion Implementation

    Type assertions (`val, ok := i.(Type)`) are implemented using runtime helpers:

    1. **Basic Type Assertions:** For pre-registered types, the type is checked against a registry.
    2. **Dynamic Type Checking:** For container types like maps and slices, the system performs runtime checks:
       - For maps: validates key and value types dynamically
       - For slices: validates element types
       - For structs: checks against constructors
       - For interfaces: validates required method implementations
    3. **Nested Type Support:** Validates complex nested types like `map[string][]struct{}`

    ```typescript
    // For m, ok := i.(map[string]int)
    const { value: m, ok } = $.typeAssert(i, {
      kind: $.TypeKind.Map,
      keyType: 'string',
      elemType: 'number'
    });
    ```

    This dynamic system eliminates the need to pre-register every possible combination of container types, making assertions scalable while preserving Go's type safety.

    #### Type Switches

    Go's type switches are implemented using a series of type assertions with the structured type system:

    ```typescript
    // Go: switch v := i.(type) { case string: ... case int: ... default: ... }
    // Translated conceptually to:
    let v: any;
    let __type = $.getTypeOf(i);
    if (__type === 'string') {
      v = i as string;
      // string case block...
    } else if (__type === 'number') {
      v = i as number;
      // int case block...
    } else {
      v = i;
      // default case block...
    }
    ```

    Runtime helpers handle the extraction of type information and perform appropriate checks.
    *   **Pointers:** Translated using a `$.Box<T>` wrapper type from the runtime. See [Boxes and Pointers](#boxes-and-pointers).
*   **Function Types:** Translated to TypeScript function types.

### Variables and Constants

*   `var` declarations are translated to `let` or `var` (TBD, likely `let`). Type inference is used where possible. Zero values are assigned explicitly.
*   `const` declarations are translated to `const`.
*   Short variable declarations (`:=`) are translated to `let` with type inference.

### Control Flow

*   **`if`/`else`:** Translated directly to TypeScript `if`/`else`. Scoped simple statements (`if x := foo(); x > 0`) are handled by declaring the variable before the `if`.
*   **`switch`:** Translated to TypeScript `switch`. Type switches require special handling using runtime type information.
*   **`for`:**
    *   Standard `for` loops (`for init; cond; post`) are translated directly to TypeScript `for` loops.
    *   `for cond` loops are translated to TypeScript `while (cond)`.
    *   `for {}` loops are translated to `while (true)`.
    *   **`for range`:** Translated to TypeScript `for...of` loops.
        *   **Go Behavior:** Go's `for range` reuses the same loop variable(s) for each iteration. If these variables are captured by a closure (e.g., inside a goroutine or `defer`), the closure will reference the final value of the variable after the loop finishes, which is a common source of bugs.
        *   **TypeScript `for...of` Behavior:** When using `let` or `const` with `for...of`, TypeScript (and modern JavaScript) creates a *new binding* for the loop variable(s) in each iteration. This avoids the closure capture pitfall common in Go.
        *   **GoScript Translation:** GoScript translates Go `for range` loops into TypeScript `for...of` loops using `let` for the loop variables.
            ```typescript
            // Go: for i, v := range mySlice { ... }
            // TS: for (let [i, v] of $.range(mySlice)) { ... } // or similar helper

            // Go: for k := range myMap { ... }
            // TS: for (let k of myMap.keys()) { ... } // or $.rangeMapKeys(myMap)

            // Go: for _, v := range myString { ... } // iterating runes
            // TS: for (let v of $.rangeString(myString)) { ... }
            ```
        *   **Divergence:** This translation *intentionally diverges* from Go's exact variable reuse semantic. By creating a new binding per iteration (`let`), the generated TypeScript code avoids the common Go pitfall where closures accidentally capture the final loop variable value. This results in code that is often more correct and aligns better with JavaScript/TypeScript developers' expectations. The compliance test `compliance/tests/for_range/` demonstrates this behavior.
*   **`defer`:** Translated using a `try...finally` block and a helper stack/array managed by the runtime (`$.defer`). See `DESIGN_DEFER.md` (TODO: Create this file).
*   **`go`:** Translated using asynchronous functions (`async`/`await`) and potentially runtime helpers (`$.go`). See `DESIGN_CONCURRENCY.md` (TODO: Create this file).
*   **`select`:** Translated using runtime helpers, likely involving `Promise.race` or similar mechanisms. See `DESIGN_CONCURRENCY.md` (TODO: Create this file).

### Functions and Methods

*   Go functions are translated to TypeScript functions.
*   Go methods are translated to TypeScript class methods.
*   Multiple return values are handled by returning tuples (arrays) or objects. The call site uses destructuring assignment.
*   Variadic functions (`...T`) are translated using rest parameters (`...args: T[]`).

### Operators

*   Most operators map directly (`+`, `-`, `*`, `/`, `%`, `==`, `!=`, `<`, `>`, `<=`, `>=`, `&&`, `||`, `!`).
*   Bitwise operators (`&`, `|`, `^`, `&^`, `<<`, `>>`) require runtime helper functions (`$.bitAnd()`, etc.) especially for integer types beyond JavaScript's standard number representation or for correct handling of signed vs unsigned shifts.
*   Pointer operations (`*`, `&`) are handled via the `$.Box<T>` type and its methods/properties (e.g., `*p` becomes `p.value`, `&x` becomes `$.box(x)` or handled implicitly via assignment).

### Concurrency

See `DESIGN_CONCURRENCY.md` (TODO: Create this file). Go's goroutines and channels are mapped to TypeScript's `async/await` and custom runtime implementations for channels.

### Error Handling

Go's explicit error return values are maintained. Functions returning an error typically have a TypeScript signature like `(...args: TArgs) => [TResult, $.error]` or `(...args: TArgs) => $.error`. Call sites check the error value.

### Builtin Functions

*   `len()`: Mapped to `.length` for arrays/strings/slices, `.size` for maps, or runtime helpers.
*   `cap()`: Mapped to runtime helpers for slices/channels.
*   `append()`: Mapped to a runtime helper function `$.append()`.
*   `make()`: Mapped to runtime helper functions (`$.makeSlice()`, `$.makeMap()`, `$.makeChan()`).
*   `new()`: Mapped to `$.box(new T())` or similar, returning a pointer (`$.Box<T>`) to a zero value.
*   `copy()`: Mapped to a runtime helper function `$.copy()`.
*   `delete()`: Mapped to `map.delete()`.
*   `panic()`/`recover()`: Mapped to throwing exceptions and `try...catch` with runtime helpers (`$.panic()`, `$.recover()`). See `DESIGN_PANIC_RECOVER.md` (TODO: Create this file).
*   `print()`/`println()`: Mapped to `console.log` or similar.

### Boxes and Pointers

See `design/BOXES_POINTERS.md`. Go pointers are represented using a `$.Box<T>` wrapper type provided by the runtime. This allows emulating pointer semantics (shared reference, ability to modify the original value indirectly) in TypeScript.

*   Taking the address (`&x`): Often implicit when assigning to a variable expecting a `$.Box<T>`, or explicitly `$.box(x)`.
*   Dereferencing (`*p`): Accessing the `p.value` property.
*   Pointer assignment (`p = q`): Assigns the `$.Box` reference.
*   Assigning to dereferenced pointer (`*p = y`): Modifying `p.value = y`.

Value types (structs, basic types) are copied on assignment unless they are boxed.

## Runtime (`@goscript/builtin`)

The runtime provides:

*   Helper types (`$.int`, `$.error`, `$.Slice`, `$.Chan`, `$.Box`, etc.).
*   Helper functions (`$.makeSlice`, `$.append`, `$.copy`, `$.panic`, `$.recover`, `$.go`, `$.defer`, bitwise operations, etc.).
*   Runtime type information utilities (for type assertions/switches).

## Known Divergences

*   **Integer Overflow:** Standard TypeScript numbers do not overflow like Go's fixed-size integers. Using `BigInt` or custom classes via `$.int` can mitigate this but adds complexity. Current implementation may use standard numbers with potential divergence on overflow.
*   **Floating Point Precision:** Differences may exist between Go's `float64`/`float32` and TypeScript's `number` (IEEE 754 64-bit float).
*   **`for range` Variable Scoping:** Go reuses loop variables, while GoScript's translation to `for...of` with `let` creates new bindings per iteration to avoid common closure capture bugs (see [Control Flow](#control-flow)).
*   **Concurrency Model:** `async/await` provides cooperative multitasking, differing from Go's preemptive goroutine scheduling. Subtle timing and fairness differences may exist.
*   **Panic/Recover vs. Exceptions:** While mapped, the exact stack unwinding and recovery mechanisms might differ subtly from Go's `panic`/`recover`.
*   **Zero Values:** Explicit assignment is used, but subtle differences in initialization order compared to Go's implicit zeroing might occur in complex scenarios (e.g., during package initialization).

## Future Considerations / TODO

*   Refine integer type handling (`BigInt` vs. custom class vs. number).
*   Detailed design docs for Structs, Interfaces, Concurrency, Defer, Panic/Recover.
*   Build System/Package Management integration.
*   Source Maps for debugging.
*   Implement standard library including "runtime" functions

# Package Structure

This is the typical package structure of the output TypeScript import path:

```
@goscript/ # Typical Go workspace, all packages live here. Includes the '@goscript/builtin' alias for the runtime.
  # Compiled Go packages go here (e.g., @goscript/my/package)
```

# Go to TypeScript Compiler Design

## Divergences from Go

This section highlights key areas where GoScript's generated TypeScript behavior differs from standard Go, primarily due to the challenges of mapping Go's memory model and semantics directly to JavaScript/TypeScript.

• **Value Receiver Method Semantics:**
  - In Go, methods with value receivers (`func (s MyStruct) Method()`) operate on a *copy* of the receiver struct.
  - In GoScript, both value and pointer receiver methods are translated to methods on the TypeScript class. Calls to value-receiver methods on a TypeScript instance modify the *original* object referenced by `this`, not a copy. This differs from Go's copy-on-call semantics for value receivers.

## Implementation Considerations

After reviewing the code and tests, some important implementation considerations include:

1. **Pointer Comparison Implementation**:
   * Ensure pointer comparisons use appropriate TypeScript equality semantics.
   * Pointer comparison operators (`==`, `!=`, `==nil`) must be correctly translated to their TypeScript equivalents.

2. **Pointer Representation, Boxing & Addressability**:
   * **Boxing:** To handle Go's pointers and addressability within JavaScript's reference model, GoScript employs a "boxing" strategy. When the address of a variable (`&v`) is taken anywhere in the code, that variable is declared using the `$.Box<T>` type from the runtime (`@goscript/builtin`). This box holds the actual value and allows multiple pointers to reference and modify the same underlying value.
     ```go
     // Go
     var x int = 10
     p := &x // Address of x is taken, so x must be boxed
     ```
     ```typescript
     // TypeScript
     import * as $ from "@goscript/builtin"
     let x: $.Box<number> = $.Box(10) // x is boxed
     let p: $.Box<number> | null = x  // p points to the box x
     ```
   * **Addressability:** Only variables that have been boxed (because their address was taken) are addressable.
   * **Pointer Types:** Go pointer types are mapped to potentially nullable `Box` types in TypeScript. See the "Type Mapping" section for details.
   * **Multi-level Pointers:** A variable (which can itself be a pointer) is boxed if its own address is taken.
     ```go
     // Go (Example from compliance/tests/boxing/boxing.go)
     var x int = 10      // x is boxed because p1 takes its address
     var p1 *int = &x    // p1 is boxed because p2 takes its address
     var p2 **int = &p1  // p2 is boxed because p3 takes its address
     var p3 ***int = &p2 // p3 is NOT boxed because its address is not taken
     ```
     This translates to:
     ```typescript
     // TypeScript
     import * as $ from "@goscript/builtin"
     let x: $.Box<number> = $.box(10);
     let p1: $.Box<$.Box<number> | null> = $.box(x); // p1's box holds a reference to x's box
     let p2: $.Box<$.Box<$.Box<number> | null> | null> = $.box(p1); // p2's box holds a reference to p1's box
     let p3: $.Box<$.Box<$.Box<number> | null> | null> | null = p2; // p3 is not boxed; it directly holds the reference to p2's box
     ```
     Dereferencing `***p3` then becomes `p3!.value!.value!.value`.

3. **Value Semantics for Structs**:
   * Go's value semantics for structs (copying on assignment) need to be properly implemented in TypeScript.
   * Method calls on value receivers versus pointer receivers need to behave consistently with Go semantics.

## Naming Conventions

- **Exported Identifiers:** Go identifiers (functions, types, variables, struct fields, interface methods) that are exported (start with an uppercase letter) retain their original PascalCase naming in the generated TypeScript code. For example, `MyFunction` in Go becomes `export function MyFunction(...)` in TypeScript, and `MyStruct.MyField` becomes `MyStruct.MyField`.
- **Unexported Identifiers:** Go identifiers that are unexported (start with a lowercase letter) retain their original camelCase naming in the generated TypeScript. If they are fields of an exported struct, they become public fields in the TypeScript class.
- **Keywords:** Go keywords are generally not an issue, but care must be taken if a Go identifier clashes with a TypeScript keyword.

## Type Mapping
- **Built-in Types:** Go built-in types are mapped to corresponding TypeScript types (e.g., `string` -> `string`, `int` -> `number`, `bool` -> `boolean`, `float64` -> `number`). If the address of a variable with a built-in type is taken, it's wrapped in `$.Box<T>` (e.g., `$.Box<number>`).

- **String and Rune Conversions:** Go's `rune` type (an alias for `int32` representing a Unicode code point) and its interaction with `string` are handled as follows:
    -   **`rune` Type:** Translated to TypeScript `number`.
    -   **`string(rune)` Conversion:** The Go conversion from a `rune` to a `string` containing that single character is translated using `String.fromCharCode()`:
        ```go
        var r rune = 'A' // Unicode point 65
        s := string(r)
        ```
        becomes:
        ```typescript
        let r: number = 65
        let s = String.fromCharCode(r) // s becomes "A"
        ```
    -   **`[]rune(string)` Conversion:** Converting a `string` to a slice of `rune`s requires a runtime helper to correctly handle multi-byte Unicode characters:
        ```go
        runes := []rune("Go€")
        ```
        becomes (conceptual translation using a runtime helper):
        ```typescript
        import * as $ from "@goscript/builtin"
        let runes = $.stringToRunes("Go€") // runes becomes [71, 111, 8364]
        ```
        *(This helper was also seen in the `for range` over strings translation).*
    -   **`string([]rune)` Conversion:** Converting a slice of `rune`s back to a `string` also requires a runtime helper:
        ```go
        s := string([]rune{71, 111, 8364})
        ```
        becomes (conceptual translation using a runtime helper):
        ```typescript
        import * as $ from "@goscript/builtin"
        let s = $.runesToString([71, 111, 8364]) // s becomes "Go€"
        ```
    *Note: Direct conversion between `string` and `[]byte` would involve different runtime helpers focusing on byte representations.*

- **Structs:** Converted to TypeScript `class`es. Both exported and unexported Go fields become `public` members in the TypeScript class. A `clone()` method is added to support Go's value semantics on assignment/read. This `clone()` method performs a deep copy of the struct's fields, including recursively cloning any nested struct fields, to ensure true value semantics.
    -   **Constructor Initialization:** The generated class constructor accepts an optional `init` object. Fields are initialized using this object. Crucially, for fields that are themselves struct *values* (not pointers):
        - If the corresponding value in `init` is provided, it is **cloned** using its `.clone()` method before assignment to maintain Go's value semantics (e.g., `this._fields.InnerStruct = $.box(init?.InnerStruct?.clone() ?? new InnerStruct())`).
        - If the corresponding value in `init` is nullish (`null` or `undefined`), the field is initialized with a *new instance* of the struct's zero value (`new FieldType()`) to maintain parity with Go's non-nullable struct semantics.
        - Pointer fields are initialized to `null` if the `init` value is nullish (no cloning needed).
        ```typescript
        // Example generated constructor logic for a field 'Inner' of type 'InnerStruct'
        public Inner: InnerStruct
        // ... other fields ...
        constructor(init?: { Inner?: InnerStruct /* ... other fields ... */ }) {
            this.Inner = init?.Inner?.clone() ?? new InnerStruct() // Clones if init.Inner exists, else creates zero value
            // ... other initializations ...
        }
        ```
-   **Field Access:** Accessing struct fields uses standard TypeScript dot notation (`instance.FieldName`). Go's automatic dereferencing for pointer field access (`ptr.Field`) translates to accessing the value with appropriate null checks. Unexported fields become public class members.
-   **Struct Composite Literals:**
        -   **Value Initialization (`T{...}`):** Translates to `new TypeName({...})`.
            ```go
            type Point struct{ X, Y int }
            v := Point{X: 1, Y: 2}
            ```
            becomes:
            ```typescript
            class Point { /* ... constructor, fields, clone ... */ }
            let v: Point = new Point({ X: 1, Y: 2 })
            ```
        -   **Pointer Initialization (`&T{...}`):** The implementation of pointer initialization needs to be documented after changes.

- **Interfaces:** Mapped to TypeScript `interface` types. Methods retain their original Go casing.
- **Embedded Interfaces:** Go interfaces can embed other interfaces. This is translated using TypeScript's `extends` keyword. The generated TypeScript interface extends all the interfaces embedded in the original Go interface.
        ```go
        // Go code
        type Reader interface { Read(p []byte) (n int, err error) }
        type Closer interface { Close() error }
        type ReadCloser interface {
            Reader // Embeds Reader
            Closer // Embeds Closer
        }
        ```
        becomes:
        ```typescript
        // TypeScript translation
        interface Reader {
            Read(_p0: number[]): [number, $.Error];
        }
        interface Closer {
            Close(): $.Error;
        }
        // ReadCloser extends both Reader and Closer
        interface ReadCloser extends Reader, Closer {
        }
        ```
    - **Runtime Registration:** When registering an interface type with the runtime (`$.registerType`), the set of method names includes all methods from the interface itself *and* all methods from any embedded interfaces.
        ```typescript
        // Example registration for ReadCloser
        const ReadCloser__typeInfo = $.registerType(
          'ReadCloser',
          $.TypeKind.Interface,
          null,
          new Set(['Close', 'Read']), // Includes methods from Reader and Closer
          undefined
        );
        ```
- **Type Assertions:** Go's type assertion syntax (`i.(T)`) allows checking if an interface variable `i` holds a value of a specific concrete type `T` or implements another interface `T`. This is translated using the `$.typeAssert` runtime helper function.
    -   **Comma-Ok Assertion (`v, ok := i.(T)`):** This form checks if the assertion holds and returns the asserted value (or zero value) and a boolean status. Handled in assignment logic.
        -   **Interface-to-Concrete Example:**
            ```go
            // Go code (from compliance/tests/interface_type_assertion)
            var i MyInterface
            s := MyStruct{Value: 10}
            i = s
            _, ok := i.(MyStruct) // Assert interface 'i' holds concrete type 'MyStruct'
            ```
            becomes:
            ```typescript
            // TypeScript translation
            import * as $ from "@goscript/builtin";

            let i: MyInterface;
            let s = new MyStruct({ Value: 10 })
            i = s.clone() // Assuming MyInterface holds values, clone needed

            // Assignment logic generates this:
            let { value: _, ok } = $.typeAssert<MyStruct>(i, 'MyStruct')
            if (ok) {
                console.log("Type assertion successful")
            }
            ```
        -   **Interface-to-Interface Example:**
            ```go
            // Go code (from compliance/tests/embedded_interface_assertion)
            var rwc ReadCloser
            s := MyStruct{} // MyStruct implements ReadCloser
            rwc = s
            _, ok := rwc.(ReadCloser) // Assert interface 'rwc' holds type 'ReadCloser'
            ```
            becomes:
            ```typescript
            // TypeScript translation
            import * as $ from "@goscript/builtin";

            let rwc: ReadCloser;
            let s = new MyStruct({  })
            rwc = s.clone() // Assuming ReadCloser holds values

            // Assignment logic generates this:
            let { value: _, ok } = $.typeAssert<ReadCloser>(rwc, 'ReadCloser')
            if (ok) {
                console.log("Embedded interface assertion successful")
            }
            ```
        -   **Translation Details:** The Go assertion `v, ok := i.(T)` is translated during assignment (`WriteStmtAssign`) to:
            1.  A call to `$.typeAssert<T>(i, 'TypeName')`.
                *   `<T>`: The target type (interface or class) is passed as a TypeScript generic parameter.
                *   `'TypeName'`: The name of the target type `T` is passed as a string literal. This string is used by the runtime helper for type checking against registered type information.
            2.  The helper returns an object `{ value: T | null, ok: boolean }`.
            3.  Object destructuring is used to extract the `value` and `ok` properties into the corresponding variables from the Go code (e.g., `let { value: v, ok } = ...`). If a variable is the blank identifier (`_`), it's assigned using `value: _` in the destructuring pattern.

    -   **Panic Assertion (`v := i.(T)`):** This form asserts that `i` holds type `T` and panics if it doesn't. Handled in expression logic (`WriteTypeAssertExpr`). The translation uses the same `$.typeAssert` helper but wraps it in an IIFE that checks `ok` and throws an error if false, otherwise returns the `value`.
- **Slices:** Go slices (`[]T`) are mapped to standard TypeScript arrays (`T[]`) augmented with a hidden `__capacity` property to emulate Go's slice semantics. Runtime helpers from `@goscript/builtin` are crucial for correct behavior.
    -   **Representation:** A Go slice is represented in TypeScript as `Array<T> & { __capacity?: number }`. The `__capacity` property stores the slice's capacity.
    -   **Creation (`make`):** `make([]T, len)` and `make([]T, len, cap)` are translated using the generic runtime helper `$.makeSlice<T>(len, cap?)`.
        ```go
        s1 := make([]int, 5)       // len 5, cap 5
        s2 := make([]int, 5, 10)  // len 5, cap 10
        var s3 []string           // nil slice
        ```
        becomes:
        ```typescript
        import * as $ from "@goscript/builtin"
        let s1 = $.makeSlice<number>(5)      // Creates array len 5, sets __capacity = 5
        let s2 = $.makeSlice<number>(5, 10) // Creates array len 5, sets __capacity = 10
        let s3: string[] = []                     // Represents nil slice as empty array
        ```
    -   **Literals:** Slice literals are translated directly to TypeScript array literals. The capacity of a slice created from a literal is equal to its length.
        ```go
        s := []int{1, 2, 3} // len 3, cap 3
        ```
        becomes:
        ```typescript
        let s = [1, 2, 3] // Runtime helpers treat this as having __capacity = 3
        ```
    -   **Length (`len(s)`):** Uses the runtime helper `$.len(s)`. Returns `0` for nil (empty array) slices.
    -   **Capacity (`cap(s)`):** Uses the runtime helper `$.cap(s)`. This helper reads the `__capacity` property or defaults to the array's `length` if `__capacity` is not set (e.g., for plain array literals). Returns `0` for nil (empty array) slices.
    -   **Access/Assignment (`s[i]`):** Translated directly using standard TypeScript array indexing (`s[i]`). Out-of-bounds access will likely throw a runtime error in TypeScript, similar to Go's panic.
    -   **Slicing (`a[low:high]`, `a[low:high:max]`):** Slicing operations create a *new* slice header (a new TypeScript array object with its own `__capacity`) that shares the *same underlying data* as the original array or slice. This is done using the `$.slice` runtime helper.
        -   `a[low:high]` translates to `$.slice(a, low, high)`. The new slice has length `high - low` and capacity `original_capacity - low`.
        -   `a[:high]` translates to `$.slice(a, undefined, high)`.
        -   `a[low:]` translates to `$.slice(a, low, undefined)`.
        -   `a[:]` translates to `$.slice(a, undefined, undefined)`.
        -   `a[low:high:max]` translates to `$.slice(a, low, high, max)`. The new slice has length `high - low` and capacity `max - low`.
        ```go
        arr := [5]int{0, 1, 2, 3, 4} // Array (len 5, cap 5)
        s1 := arr[1:4]      // [1, 2, 3], len 3, cap 4 (5-1)
        s2 := s1[1:2]       // [2], len 1, cap 3 (cap of s1 - 1)
        s3 := arr[0:2:3]    // [0, 1], len 2, cap 3 (3-0)
        ```
        becomes:
        ```typescript
        let arr = [0, 1, 2, 3, 4]
        let s1 = $.slice(arr, 1, 4)      // len 3, __capacity 4
        let s2 = $.slice(s1, 1, 2)       // len 1, __capacity 3
        let s3 = $.slice(arr, 0, 2, 3)   // len 2, __capacity 3
        ```
        *Important:* Modifications made through a slice affect the underlying data. As demonstrated in the compliance tests (e.g., "Slicing a slice"), changes made via one slice variable (like `subSlice2` modifying index 0) are visible through other slice variables (`subSlice1`, `baseSlice`) that share the same underlying memory region.
    -   **Append (`append(s, ...)`):** Translated using the `$.append` runtime helper. Crucially, the result of `$.append` *must* be assigned back to the slice variable, as `append` may return a new slice instance if reallocation occurs.
        ```go
        s = append(s, elem1, elem2)
        s = append(s, anotherSlice...) // Spread operator
        ```
        becomes:
        ```typescript
        s = $.append(s, elem1, elem2)
        s = $.append(s, ...anotherSlice) // Spread operator
        ```
        -   **Behavior:**
            -   If appending fits within the existing capacity (`len(s) + num_elements <= cap(s)`), elements are added to the underlying array, and the original slice header's length is updated (potentially modifying the same object `s` refers to). The underlying array is modified.
            -   If appending exceeds the capacity, a *new*, larger underlying array is allocated, the existing elements plus the new elements are copied to it, and `append` returns a *new* slice header referencing this new array. The original underlying array is *not* modified beyond its bounds.
            -   Appending to a nil slice allocates a new underlying array.
- **Arrays:** Go arrays (e.g., `[5]int`) have a fixed size known at compile time. They are also mapped to TypeScript arrays (`T[]`), but their fixed-size nature is enforced during compilation (e.g., preventing `append`). Slicing an array (`arr[:]`, `arr[low:high]`, etc.) uses the `$.slice` helper, resulting in a Go-style slice backed by the original array data.
    -   **Sparse Array Literals:** For Go array literals with specific indices (e.g., `[5]int{1: 10, 3: 30}`), unspecified indices are filled with the zero value of the element type in the generated TypeScript. For example, `[5]int{1: 10, 3: 30}` becomes `[0, 10, 0, 30, 0]`.

*Note: The distinction between slices and arrays in Go is important. While both often map to TypeScript arrays, runtime helpers (`makeSlice`, `slice`, `len`, `cap`, `append`) and the `__capacity` property are essential for emulating Go's slice semantics accurately.*
- **Maps:** Go maps (`map[K]V`) are translated to TypeScript's standard `Map<K, V>` objects. Various Go map operations are mapped as follows:
    -   **Creation (`make`):** `make(map[K]V)` is translated using a runtime helper:
        ```go
        m := make(map[string]int)
        ```
        becomes:
        ```typescript
        import * as $ from "@goscript/builtin"
        let m = $.makeMap<string, number>() // Using generics for type information
        ```
    -   **Literals:** Map literals are translated to `new Map(...)`:
        ```go
        m := map[string]int{"one": 1, "two": 2}
        ```
        becomes:
        ```typescript
        let m = new Map([["one", 1], ["two", 2]])
        ```
    -   **Assignment (`m[k] = v`):** Uses a runtime helper `mapSet`:
        ```go
        m["three"] = 3
        ```
        becomes:
        ```typescript
        $.mapSet(m, "three", 3)
        ```
    -   **Access (`m[k]`):** Uses the standard `Map.get()` method combined with the nullish coalescing operator (`??`) to provide the zero value if the key is not found.
        ```go
        val := m["one"] // Assuming m["one"] exists
        zero := m["nonexistent"] // Assuming m["nonexistent"] doesn't exist
        ```
        becomes (simplified conceptual translation):
        ```typescript
        let val = m.get("one") ?? 0 // Provide zero value (0 for int) if undefined
        let zero = m.get("nonexistent") ?? 0 // Provide zero value (0 for int) if undefined
        ```
    -   **Comma-Ok Idiom (`v, ok := m[k]`):** Translated using `Map.has()` and `Map.get()` with zero-value handling during assignment:
        ```go
        v, ok := m["three"]
        ```
        becomes:
        ```typescript
        // Assignment logic generates this:
        let ok: boolean
        let v: number
        ok = m.has("three")
        v = m.get("three") ?? 0 // Provide zero value if key doesn't exist
        ```
    -   **Length (`len(m)`):** Uses a runtime helper `len`:
        ```go
        size := len(m)
        ```
        becomes:
        ```typescript
        let size = $.len(m) // Uses runtime helper, not Map.size directly
        ```
    -   **Deletion (`delete(m, k)`):** Uses a runtime helper `deleteMapEntry`:
        ```go
        delete(m, "two")
        ```
        becomes:
        ```typescript
        $.deleteMapEntry(m, "two")
        ```
    -   **Iteration (`for k, v := range m`):** Uses standard `Map.entries()` and `for...of`:
        ```go
        for key, value := range m {
            // ...
        }
        ```
        becomes:
        ```typescript
        for (const [k, v] of m.entries()) {
            // ... (key and value are block-scoped)
        }
        ```
    *Note: The reliance on runtime helpers (`@goscript/builtin`) is crucial for correctly emulating Go's map semantics, especially regarding zero values and potentially type information for `makeMap`.*
- **Functions:** Converted to TypeScript `function`s. Exported functions are prefixed with `export`.
- **Function Literals:** Go function literals (anonymous functions) are translated into TypeScript arrow functions (`=>`).
    ```go
    greet := func(name string) string {
        return "Hello, " + name
    }
    message := greet("world")
    ```
    becomes:
    ```typescript
    let greet = (name: string): string => { // Arrow function
        return "Hello, " + name
    }
    let message = greet("world")
    ```
- **Methods:** Go functions with receivers are generated as methods within the corresponding TypeScript `class`. They retain their original Go casing.
    -   **Receiver Type (Value vs. Pointer):** Both value receivers (`func (m MyStruct) Method()`) and pointer receivers (`func (m *MyStruct) Method()`) are translated into regular methods on the TypeScript class.
        ```go
        type Counter struct{ count int }
        func (c Counter) Value() int { return c.count } // Value receiver
        func (c *Counter) Inc()    { c.count++ }       // Pointer receiver
        ```
        becomes:
        ```typescript
        class Counter {
            private count: number = 0;
            // Receiver 'c' bound to 'this'
            public Value(): number { const c = this; return c.count; }
            public Inc(): void    { const c = this; c.count++; }
            // ... constructor, clone ...
        }
        ```
    -   **Method Calls:** Go allows calling pointer-receiver methods on values (`value.PtrMethod()`) and value-receiver methods on pointers (`ptr.ValueMethod()`) via automatic referencing/dereferencing. The translation of these in TypeScript needs to be documented after implementation changes.
    -   **Receiver Binding:** As per Code Generation Conventions, the Go receiver identifier (e.g., `c`) is bound to `this` within the method body (`const c = this`).
    -   **Semantic Note on Value Receivers:** See "Divergences from Go".

## Value Semantics

Go's value semantics (where assigning a struct copies it) are emulated in TypeScript by:
1.  Adding a `clone()` method to generated classes representing structs. This method performs a deep copy.
    -   The `clone()` method creates a new instance of the struct and then copies the values from the original struct's `_fields` to the new instance's `_fields`. For each field, the value is retrieved from the source box (e.g., `this._fields.MyInt.value`) and then re-boxed in the destination (e.g., `cloned._fields.MyInt = $.box(...)`).
    -   For nested struct fields, the `clone()` method of the nested struct is called recursively (e.g., `cloned._fields.InnerStruct = $.box(this._fields.InnerStruct.value?.clone() ?? null)`).
    ```typescript
    // Example: MyStruct.clone()
    public clone(): MyStruct {
        const cloned = new MyStruct()
        cloned._fields = {
            MyInt: $.box(this._fields.MyInt.value),
            MyString: $.box(this._fields.MyString.value)
        }
        return cloned
    }

    // Example: NestedStruct.clone() with nested MyStruct
    public clone(): NestedStruct {
        const cloned = new NestedStruct()
        cloned._fields = {
            Value: $.box(this._fields.Value.value),
            InnerStruct: $.box(this._fields.InnerStruct.value?.clone() ?? new MyStruct()) // Recursive clone
        }
        return cloned
    }
    ```
2.  Automatically calling `.clone()` during assignment statements (`=`, `:=`) whenever a struct *value* is being copied.
    -   If the source variable is a direct struct instance (not boxed), it's `let valueCopy = original.clone()`.
    -   If the source variable is a `$.Box<StructType>` (because its address was taken), the assignment becomes `let valueCopy = original.value.clone()`.
    ```go
    // Go
    original := MyStruct{MyInt: 42}
    valueCopy := original
    // (later &original might be used, causing 'original' to be boxed in TS)
    ```
    ```typescript
    // TypeScript (assuming 'original' is boxed)
    let original: $.Box<MyStruct> = $.box(new MyStruct({MyInt: 42}));
    let valueCopy = original.value.clone();
    ```
3.  Pointer assignments preserve Go's reference semantics by copying the reference to the `$.Box` or the direct object reference (for unboxed struct pointers).

Pointer assignments are handled as described under Operators (`&`, `*`) and Pointer Representation/Boxing.

## Multi-Assignment Statements

Go's multi-assignment statements (where multiple variables are assigned in a single statement) are translated based on the RHS:
- **Multiple RHS values:** `a, b := val1, val2` becomes separate assignments `let a = compiled_val1; let b = compiled_val2`.
- **Single function call RHS:** `a, b := funcReturningTwoValues()` becomes destructuring assignment `let [a, b] = funcReturningTwoValues()`.
- **Map comma-ok RHS:** `v, ok := myMap[key]` becomes separate assignments for `ok` and `v` using `Map.has` and `Map.get`.
- **Type assertion comma-ok RHS:** `v, ok := i.(T)` becomes destructuring assignment `let { value: v, ok } = $.typeAssert(...)`.
- **Channel receive comma-ok RHS:** `v, ok := <-ch` becomes destructuring assignment `const { value: v, ok } = await ch.receiveWithOk()`.

The blank identifier (`_`) in Go results in the omission of the corresponding variable in the TypeScript assignment/destructuring pattern, though the RHS expression is still evaluated for potential side effects.

## Operators

Go operators are generally mapped directly to their TypeScript equivalents:

- **Arithmetic Operators:** `+`, `-`, `*`, `/`, `%` map directly. Integer division `/` is wrapped in `Math.floor()`.
- **Comparison Operators:**
    - `==`, `!=` for **pointers**: Map directly to `===`, `!==` (reference equality).
    - `==`, `!=` for **non-pointers**: Map directly to `===`, `!==`. Struct comparison is reference equality unless specific comparison methods are defined.
    - `<`, `<=`, `>`, `>=`: Map directly.
- **Address Operator (`&`):**
    - Taking the address of a variable (`&v`) translates to referencing the `$.Box<T>` object associated with `v`.
    ```go
    var x int
    p := &x // x becomes boxed here
    ```
    ```typescript
    let x: $.Box<number> = $.Box(0) // x declared as Box
    let p: $.Box<number> | null = x         // p gets reference to x's Box
    ```
- **Dereference Operator (`*`):**
    - Dereferencing a pointer (`*p`) translates to accessing the `.value` property of the corresponding `Box`.
    - Dereferencing a pointer to a struct depends on the context (see `design/BOXES_POINTERS.md`).
    - **Multi-level Dereferencing:** Involves chaining `.value` accesses, corresponding to each level of boxing for the intermediate pointers.
      ```go
      // Go (from compliance/tests/boxing/boxing.go)
      // var x int = 10; var p1 *int = &x; var p2 **int = &p1; var p3 ***int = &p2;
      // x is $.Box<number>
      // p1 is $.Box<$.Box<number> | null>
      // p2 is $.Box<$.Box<$.Box<number> | null> | null>
      // p3 is $.Box<$.Box<$.Box<number> | null> | null> | null (refers to p2's box)
      ***p3 = 12
      y := ***p3
      ```
      ```typescript
      // TypeScript
      // ... (declarations as above)
      p3!.value!.value!.value = 12
      let y: number = p3!.value!.value!.value
      ```
- **Pointer Assignment:**
    - **Assigning an address to a pointer (`p = &v`):**
        - If the pointer variable `p` on the left-hand side is *not* boxed, it's assigned the reference to `v`'s `$.Box`.
          ```go
          // Case 1: Pointer p is not boxed
          var x int = 10 // x will be boxed
          var p *int     // p is not boxed
          p = &x         // Assign address of x to p
          ```
          ```typescript
          let x: $.Box<number> = $.box(10)
          let p: $.Box<number> | null // p is not a Box itself
          p = x // p now holds the reference to x's Box
          ```
        - If the pointer variable `p1` on the left-hand side *is* boxed (because `&p1` was taken elsewhere), its `.value` is updated to point to `v`'s `$.Box`.
          ```go
          // Case 2: Pointer p1 IS boxed
          // Assume: var p1 $.Box<$.Box<number> | null> (p1 was boxed)
          var y int = 15 // y will be boxed
          p1 = &y
          ```
          ```typescript
          // Assume: let p1: $.Box<$.Box<number> | null> = ...;
          let y: $.Box<number> = $.box(15)
          p1.value = y // Update the inner value of p1's Box to point to y's Box
          ```
    - **Assigning to a dereferenced pointer (`*p = val`):** Translates to assigning to the `.value` property of the `Box` that `p` (or the final pointer in a chain) refers to.
      ```go
      // Assume p points to x's box: p: $.Box<number> | null = x_box
      *p = 100
      ```
      ```typescript
      p!.value = 100 // Assign to the value inside the Box p points to
      ```
- **Bitwise Operators:** `&`, `|`, `^`, `&^`, `<<`, `>>` map to TS `&`, `|`, `^`, `& ~`, `<<`, `>>`. Bitwise NOT `^x` maps to `~x`.

## Control Flow

### For Statements

Go has a single `for` construct. We map it to TypeScript's `for` and `while` loops.

*   **Standard `for` loop (init; condition; post):**
    ```go
    for i := 0; i < 10; i++ {
        // ...
    }
    ```
    Translates directly to a TypeScript `for` loop:
    ```typescript
    for (let i = 0; i < 10; i++) {
        // ...
    }
    ```
    Variable scoping within the loop follows Go rules, potentially requiring temporary variables in TypeScript if loop variables are captured in closures.

*   **`while` loop (condition only):**
    ```go
    for condition {
        // ...
    }
    ```
    Translates to a TypeScript `while` loop:
    ```typescript
    while (condition) {
        // ...
    }
    ```

*   **Infinite loop:**
    ```go
    for {
        // ...
    }
    ```
    Translates to an infinite TypeScript `for` loop:
    ```typescript
    for (;;) {
        // ...
    }
    ```

*   **`for range` loop:**
    The Go specification states that the range expression (the collection being iterated over) is evaluated *once* before the loop begins. The loop iterates over a snapshot of the collection's elements (or at least, its length and elements are fixed).

    *   **Slices:**
        ```go
        s := []int{10, 20, 30}
        for i, v := range s {
            // ... use i and v
        }
        for i := range s {
            // ... use i
        }
        for _, v := range s {
            // ... use v
        }
        ```
        To ensure the "evaluate once" semantic, a helper function `__gs_range` (defined in `@goscript/builtin`) is used. This function takes the slice and returns an iterable yielding `[index, value]` pairs based on the slice's state when `__gs_range` was called.
        ```typescript
        import { __gs_range } from "@goscript/builtin"

        const s: number[] = [10, 20, 30] // Assuming slice maps to array
        // index and value
        for (const [i, v] of __gs_range(s)) {
            // ... use i and v
        }
        // index only
        for (const [i] of __gs_range(s)) { // Or potentially optimized helper
            // ... use i
        }
        // value only
        for (const [, v] of __gs_range(s)) {
            // ... use v
        }
        ```

    *   **Arrays:**
        Go arrays have a fixed size. The "evaluate once" semantic applies similarly, meaning the loop iterates over the elements as they were when the loop started, even if the array's elements are modified during iteration.
        ```go
        var a [3]int = [3]int{10, 20, 30}
        for i, v := range a {
            // ... use i and v
        }
        for i := range a {
            // ... use i
        }
        ```
        To achieve this, a *copy* of the array is made before the loop begins.
        ```typescript
        // Assume 'a' is the TypeScript representation of the Go array
        const __copy_a = [...a] // Create a copy

        // index and value
        const __len_a = __copy_a.length // Length evaluated once
        for (let i = 0; i < __len_a; i++) {
            const v = __copy_a[i] // Use value from the copy
            // ... use i and v
        }

        // index only
        // Note: Current implementation uses for...in on the copy
        for (const i_str in __copy_a) {
             const i = parseInt(i_str) // Index from string key
             if (isNaN(i)) { continue } // Skip non-numeric keys if any
             // ... use i
        }
        // Alternative (potentially cleaner):
        // const __len_a = __copy_a.length
        // for (let i = 0; i < __len_a; i++) {
        //     // ... use i
        // }


        // value only
        const __len_a_val = __copy_a.length
        for (let i = 0; i < __len_a_val; i++) {
            const v = __copy_a[i] // Use value from the copy
            // ... use v
        }
        ```
        The copy ensures that modifications to the original array `a` during the loop do not affect the iteration range or the values yielded by the loop, matching Go's behavior. The index-only iteration currently uses `for...in` on the copy; while functional, using a standard indexed `for` loop might be considered for consistency.

### Break and Continue

`break` and `continue` statements are translated directly to their TypeScript counterparts. Labeled `break` and `continue` are also supported and map directly to labeled statements in TypeScript.

## Control Flow: `switch` Statements

Go's `switch` statement is translated into a standard TypeScript `switch` statement.

-   **Basic Switch:**
    ```go
    switch value {
    case 1:
        // do something
    case 2, 3: // Multiple values per case
        // do something else
    default:
        // default action
    }
    ```
    becomes:
    ```typescript
    switch (value) {
        case 1:
            // do something
            break // Automatically added
        case 2: // Multiple Go cases become separate TS cases
        case 3:
            // do something else
            break // Automatically added
        default:
            // default action
            break // Automatically added
    }
    ```
    *Note: `break` statements are automatically inserted at the end of each translated `case` block to replicate Go's default behavior of not falling through.*

-   **Switch without Expression:** A Go `switch` without an expression (`switch { ... }`) is equivalent to `switch true { ... }` and is useful for cleaner if/else-if chains. This translates similarly, comparing `true` against the case conditions.
    ```go
    switch {
    case x < 0:
        // negative
    case x == 0:
        // zero
    default: // x > 0
        // positive
    }
    ```
    becomes:
    ```typescript
    switch (true) {
        case x < 0:
            // negative
            break
        case x == 0:
            // zero
            break
        default:
            // positive
            break
    }
    ```
-   **Fallthrough:** Go's explicit `fallthrough` keyword is *not* currently supported and would require specific handling if implemented.

## Control Flow: `select` Statements

Go's `select` statement, used for channel communication, is translated using a runtime helper:

```go
select {
case val, ok := <-ch1:
    // Process received value
case ch2 <- value:
    // Process after sending
default:
    // Default case
}
```

becomes:

```typescript
import * as $ from "@goscript/builtin"

await $.selectStatement([
    {
        id: 0,  // Unique identifier for this case
        isSend: false,  // This is a receive operation
        channel: ch1,
        onSelected: async (result) => {
            // Assignment logic handles declaration
            const { value: val, ok } = result
            // Process received value
        }
    },
    {
        id: 1,  // Unique identifier for this case
        isSend: true,  // This is a send operation
        channel: ch2,
        value: value,
        onSelected: async () => {
            // Process after sending
        }
    }
], true)  // true indicates there's a default case
```

The `selectStatement` helper takes an array of case objects, each containing:
- `id`: A unique identifier for the case
- `isSend`: Boolean indicating whether this is a send (`true`) or receive (`false`) operation
- `channel`: The channel to operate on
- `value`: (For send operations) The value to send
- `onSelected`: Callback function that runs when this case is selected

For receive operations, the callback receives a `result` object with `value` and `ok` properties, similar to Go's comma-ok syntax. The second parameter to `selectStatement` indicates whether the `select` has a default case.

## Control Flow: `if` Statements

Go's `if` statements are translated into standard TypeScript `if` statements.

-   **Basic `if`/`else if`/`else`:**
    ```go
    if condition1 {
        // block 1
    } else if condition2 {
        // block 2
    } else {
        // block 3
    }
    ```
    becomes:
    ```typescript
    if (condition1) {
        // block 1
    } else if (condition2) {
        // block 2
    } else {
        // block 3
    }
    ```

-   **`if` with Short Statement:** Go allows an optional short statement (typically variable initialization) before the condition. The scope of variables declared in the short statement is limited to the `if` (and any `else if`/`else`) blocks. This is translated by declaring the variable(s) before the `if` statement in TypeScript, often within a simple block `{}` to mimic the limited scope.
    ```go
    if v := computeValue(); v > 10 {
        // use v
    } else {
        // use v
    }
    // v is not accessible here
    ```
    becomes:
    ```typescript
    { // Block to limit scope
        let v = computeValue()
        if (v > 10) {
            // use v
        } else {
            // use v
        }
    }
    // v is not accessible here
    ```

## Zero Values

Go's zero values are mapped as follows:
- `number`: `0`
- `string`: `""`
- `boolean`: `false`
- `struct`: `new TypeName()` (Value type `T`)
- `pointer`: `null` 
- `interface`, `slice`, `map`, `channel`, `function`: `null` or empty equivalent (`[]`, `new Map()`, etc. depending on context and runtime helpers).

## Packages and Imports

- Go packages are mapped to TypeScript modules under the `@goscript/` scope (e.g., `import { MyType } from '@goscript/my/package';`).
- The GoScript runtime is imported using the `@goscript/builtin` alias, which maps to the `builtin/builtin.ts` file.
- Standard Go library packages might require specific runtime implementations or shims.

## Code Generation Conventions

- **No Trailing Semicolons:** Generated TypeScript code omits semicolons at end of statements. Statements are line-separated without `;`.

## Asynchronous Operations (Async/Await)

GoScript handles Go's concurrency primitives (like channels and potentially goroutines in the future) by mapping them to TypeScript's `async`/`await` mechanism where appropriate.

### Function Coloring

To determine which functions need to be marked `async` in TypeScript, the compiler performs a "function coloring" analysis during compilation:

1.  **Base Cases (Async Roots):**
    *   A function is inherently **Asynchronous** if its body contains:
        *   A channel receive operation (`<-ch`).
        *   A channel send operation (`ch <- val`).
        *   A `select` statement.
        *   A goroutine creation (`go` statement).
2.  **Propagation:**
    *   A function is marked **Asynchronous** if it directly calls another function that is already marked **Asynchronous**.
3.  **Default:**
    *   If a function does not meet any of the asynchronous criteria above, it is considered **Synchronous**.

### Analysis Phase

The GoScript compiler incorporates a dedicated analysis phase that executes after parsing and type checking but before code generation. This phase performs a comprehensive traversal of the Go Abstract Syntax Tree (AST), leveraging type information provided by the `go/packages` and `go/types` libraries. The primary goal is to gather all necessary information about the code's structure, semantics, and potential runtime behavior upfront.

All collected information is stored in a read-only `Analysis` struct. This ensures that the subsequent code generation phase can focus solely on translating the AST into TypeScript based on pre-computed facts, without needing to perform complex analysis or maintain mutable state during writing.

Key responsibilities of the analysis phase include:

- **Processing Imports:** Collects and organizes import information, including import paths and aliased names, for use in generating TypeScript import statements.
- **Handling Comment Maps:** Associates comments with the relevant AST nodes, preserving comments for inclusion in the generated code.
- **Analyzing Asynchronous Operations and Defer Statements:**
    - Identifies which functions (including function literals) are asynchronous based on the presence of channel operations, `select` statements, goroutine creations, or calls to other asynchronous functions. This "function coloring" is essential for generating correct `async`/`await` code.
    - Determines which code blocks contain `defer` statements.
    - Specifically identifies if a `defer` statement refers to an asynchronous function literal. This information is used to decide whether to use `await using $.AsyncDisposableStack()` for the block and generate an `async () => { ... }` callback for the deferred function.
- **Analyzing Unexported Field Access:** Unexported fields of structs are translated as public fields in TypeScript. Go's package-level visibility for unexported fields is not strictly enforced in the generated TypeScript; all fields become public.

By performing these analyses ahead of time, the compiler simplifies the code generation process and improves the overall correctness and maintainability of the generated TypeScript code.

### Channel Operations

Channel operations are translated as follows:

-   **Creation:** `make(chan T, capacity)` is translated to `$.makeChannel<T>(capacity, zeroValueOfTypeT)`. For unbuffered channels (`make(chan T)`), the capacity is `0`.
-   **Receive:** `val := <-ch` is translated to `val = await ch.receive()`.
-   **Receive (comma-ok):** `val, ok := <-ch` is translated to `const { value: val, ok } = await ch.receiveWithOk()`.
-   **Send:** `ch <- val` is translated to `await ch.send(val)`.
-   **Close:** `close(ch)` is translated to `ch.close()`.

### Goroutines

Go's goroutine creation (`go func() { ... }()`) is translated to a call to `queueMicrotask` with the target function wrapped in an async arrow function:

```go
go func() {
    // Goroutine body
}()
```

becomes:

```typescript
queueMicrotask(async () => {
    {
        // Goroutine body
    }
})
```

### TypeScript Generation

## Functions

-   **Async Functions:** Go functions colored as **Asynchronous** are generated as TypeScript `async function`s. Their return type `T` is wrapped in a `Promise<T>`. If the function has no return value, the TypeScript return type is `Promise<void>`.
-   **Sync Functions:** Go functions colored as **Synchronous** are generated as regular TypeScript `function`s with their corresponding return types.
-   **Function Calls:** When a Go function call targets an **Asynchronous** function, the generated TypeScript call expression is prefixed with the `await` keyword. Calls to **Synchronous** functions are generated directly without `await`.

This coloring approach ensures that asynchronous operations propagate correctly through the call stack in the generated TypeScript code.

### Async Example

Consider the following Go code using a channel:

```go
package main

// This function receives from a channel, making it async.
func receiveFromChan(ch chan int) int {
	val := <-ch // This operation makes the function async
	return val
}

// This function calls an async function, making it async too.
func caller(ch chan int) int {
	// We expect this call to be awaited in TypeScript
	result := receiveFromChan(ch)
	return result + 1
}

func main() {
	myChan := make(chan int, 1)
	myChan <- 10
	finalResult := caller(myChan)
	println(finalResult) // Expected output: 11
	close(myChan)
}

```

This translates to the following TypeScript:

```typescript
import * as $ from "@goscript/builtin";

// Marked async because it contains 'await ch.receive()'
async function receiveFromChan(ch: $.Channel<number>): Promise<number> {
	let val = await ch.receive()
	return val
}

// Marked async because it calls the async 'receiveFromChan'
async function caller(ch: $.Channel<number>): Promise<number> {
	let result = await receiveFromChan(ch)
	return result + 1
}

// Marked async because it calls the async 'caller' and uses 'await myChan.send()'
export async function main(): Promise<void> {
	let myChan = $.makeChannel<number>(1, 0)
	await myChan.send(10) // Send is awaited
	let finalResult = await caller(myChan)
	console.log(finalResult)
	myChan.close()
}

```

*Note on Microtasks:* While Go's concurrency model involves goroutines and a scheduler, the TypeScript translation primarily uses `async`/`await` and Promises for channel operations. Starting a new Goroutine with the `go` keyword is translated to a call to `queueMicrotask` with the target function,  scheduling it to run asynchronously.
