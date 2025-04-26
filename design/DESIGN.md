# Package Structure

This is the typical package structure of the output TypeScript import path:

```
@go/ # Typical Go workspace, all packages live here. Includes the '@go/builtin' alias for the runtime.
  # Compiled Go packages go here (e.g., @go/my/package)
```

# Go to TypeScript Compiler Design

## Naming Conventions

- **Exported Identifiers:** Go identifiers (functions, types, variables, struct fields, interface methods) that are exported (start with an uppercase letter) retain their original PascalCase naming in the generated TypeScript code. For example, `MyFunction` in Go becomes `export function MyFunction(...)` in TypeScript, and `MyStruct.MyField` becomes `MyStruct.MyField`.
- **Unexported Identifiers:** Go identifiers that are unexported (start with a lowercase letter) retain their original camelCase naming but are typically not directly accessible in the generated TypeScript unless they are part of an exported struct's definition (where they might become private fields).
- **Keywords:** Go keywords are generally not an issue, but care must be taken if a Go identifier clashes with a TypeScript keyword.

## Type Mapping
- **Built-in Types:** Go built-in types are mapped to corresponding TypeScript types (e.g., `string` -> `string`, `int` -> `number`, `bool` -> `boolean`, `float64` -> `number`).
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
        import * as goscript from "@go/builtin"
        let runes = goscript.stringToRunes("Go€") // runes becomes [71, 111, 8364]
        ```
        *(This helper was also seen in the `for range` over strings translation).*
    -   **`string([]rune)` Conversion:** Converting a slice of `rune`s back to a `string` also requires a runtime helper:
        ```go
        s := string([]rune{71, 111, 8364})
        ```
        becomes (conceptual translation using a runtime helper):
        ```typescript
        import * as goscript from "@go/builtin"
        let s = goscript.runesToString([71, 111, 8364]) // s becomes "Go€"
        ```
    *Note: Direct conversion between `string` and `[]byte` would involve different runtime helpers focusing on byte representations.*

- **Structs:** Converted to TypeScript `class`es. Exported fields become `public` members, unexported fields become `private` members. A `clone()` method is added to support Go's value semantics on assignment.
-   **Field Access:** Accessing exported struct fields uses standard TypeScript dot notation (`instance.FieldName`). Go's automatic dereferencing for pointer field access (`ptr.Field`) translates to using optional chaining (`ptr?.FieldName`) in TypeScript due to the `T | null` pointer mapping. Unexported fields become `private` class members and are generally not accessible from outside the class.
-   **Struct Composite Literals:**
        -   **Value Initialization (`T{...}`):** Initializing a struct value translates directly to creating a new instance of the corresponding TypeScript class using its constructor.
            ```go
            type Point struct{ X, Y int }
            v := Point{X: 1, Y: 2} // v is Point
            ```
            becomes:
            ```typescript
            class Point { /* ... constructor, fields, clone ... */ }
            let v = new Point({ X: 1, Y: 2 }) // v is Point
            ```
            *Note: Assigning from a composite literal value (`T{...}`) directly to a variable (`v := T{...}` or `var v = T{...}`) translates to `new Type(...)` without an immediate `.clone()`. For assignments from *other* struct values, `.clone()` is invoked to ensure the assigned variable holds an independent copy, as per the "Value Semantics" section.*
        -   **Pointer Initialization (`&T{...}`):** Initializing a pointer to a struct using a composite literal with the address-of operator (`&`) also translates directly to creating a new class instance. The resulting TypeScript object represents the non-null pointer value.
            ```go
            p := &Point{X: 1, Y: 2} // p is *Point
            ```
            becomes:
            ```typescript
            let p = new Point({ X: 1, Y: 2 }) // p is Point (representing the non-null pointer case)
            ```
        *Note: The distinction between pointer and value initialization in Go is primarily relevant for assignment semantics (cloning for values) and method receiver types, rather than the initial object creation in TypeScript.*
- **Pointers (`*T`):** Mapped to TypeScript union types (`T | null`).
- **Interfaces:** Mapped to TypeScript `interface` types. Methods retain their original Go casing.
- **Type Assertions:** Go's type assertion syntax (`i.(T)`) allows checking if an interface variable `i` holds a value of a specific concrete type `T` or implements another interface `T`. This is translated using the `goscript.typeAssert` runtime helper function.
    -   **Comma-Ok Assertion (`v, ok := i.(T)`):** This form checks if the assertion holds and returns the asserted value (or zero value) and a boolean status.
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
            import * as goscript from "@go/builtin";

            let i: MyInterface;
            let s = new MyStruct({ Value: 10 })
            i = s.clone()

            // goscript.typeAssert returns { value: T | null, ok: boolean }
            const _tempVar1 = goscript.typeAssert<MyStruct>(i, 'MyStruct')
            let ok = _tempVar1.ok // Extract boolean status
            // let _ = _tempVar1.value // Value could be extracted if needed
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
            import * as goscript from "@go/builtin";

            let rwc: ReadCloser;
            let s = new MyStruct({  })
            rwc = s.clone()

            // Type assertion checks if 'rwc' implements 'ReadCloser'
            const _tempVar1 = goscript.typeAssert<ReadCloser>(rwc, 'ReadCloser')
            let ok = _tempVar1.ok
            if (ok) {
                console.log("Embedded interface assertion successful")
            }
            ```
        -   **Translation Details:** The Go assertion `v, ok := i.(T)` is translated to:
            1.  A call to `goscript.typeAssert<T>(i, 'TypeName')`.
                *   `<T>`: The target type (interface or class) is passed as a TypeScript generic parameter.
                *   `'TypeName'`: The name of the target type `T` is passed as a string literal. This string is used by the runtime helper for type checking against registered type information.
            2.  The helper returns an object `{ value: T | null, ok: boolean }`.
            3.  The `ok` boolean is extracted into the `ok` variable from the Go code.
            4.  The `value` (which is `T` if `ok` is true, or `null` otherwise) is extracted into the `v` variable from the Go code (or assigned to a temporary variable if `v` is `_`).

    -   **Panic Assertion (`v := i.(T)`):** This form asserts that `i` holds type `T` and panics if it doesn't. The translation uses the same `goscript.typeAssert` helper. After the call, the generated code would check the `ok` flag from the result. If `ok` is false, the code would trigger a runtime panic (e.g., by throwing an error) to mimic Go's behavior. The asserted value is assigned to `v` only if `ok` is true.
- **Slices:** Go slices (`[]T`) are mapped to standard TypeScript arrays (`T[]`). However, Go's slice semantics, particularly regarding length, capacity, and creation with `make`, require runtime support.
    -   **Creation (`make`):** `make([]T, len)` and `make([]T, len, cap)` are translated using a runtime helper `makeSlice`:
        ```go
        s1 := make([]int, 5)
        s2 := make([]int, 5, 10)
        ```
        becomes:
        ```typescript
        import * as goscript from "@go/builtin"
        let s1 = goscript.makeSlice("int", 5)       // Creates array of length 5, capacity 5
        let s2 = goscript.makeSlice("int", 5, 10)  // Creates array of length 5, capacity 10 (runtime handles capacity)
        ```
        *Note: The runtime (`@go/builtin`) likely manages the capacity concept internally, as standard TypeScript arrays don't have explicit capacity.*
    -   **Literals:** Slice literals are translated directly to TypeScript array literals:
        ```go
        s := []int{1, 2, 3}
        ```
        becomes:
        ```typescript
        let s = [1, 2, 3]
        ```
    -   **Length (`len(s)`):** Uses a runtime helper `len`:
        ```go
        l := len(s)
        ```
        becomes:
        ```typescript
        let l = goscript.len(s) // Not s.length directly, to potentially handle nil slices correctly
        ```
    -   **Capacity (`cap(s)`):** Uses a runtime helper `cap`:
        ```go
        c := cap(s)
        ```
        becomes:
        ```typescript
        let c = goscript.cap(s) // Runtime provides capacity info
        ```
    -   **Access/Assignment (`s[i]`):** Translated directly using standard TypeScript array indexing.
    -   **Append (`append(s, ...)`):** Requires a runtime helper `append` to handle potential resizing and capacity changes according to Go rules. (This is assumed based on Go semantics, though not explicitly in this specific test).
    -   **Slicing (`s[low:high]`):** Requires runtime support to correctly handle Go's slicing behavior, which creates a new slice header sharing the underlying array. (Assumed, not in this test).
- **Arrays:** Go arrays (e.g., `[5]int`) have a fixed size known at compile time. They are also mapped to TypeScript arrays (`T[]`), but their fixed-size nature is enforced during compilation (e.g., preventing `append`).
    -   **Sparse Array Literals:** For Go array literals with specific indices (e.g., `[5]int{1: 10, 3: 30}`), unspecified indices are filled with the zero value of the element type in the generated TypeScript. For example, `[5]int{1: 10, 3: 30}` becomes `[0, 10, 0, 30, 0]`.

*Note: The distinction between slices and arrays in Go is important. While both map to TypeScript arrays, runtime helpers are essential for emulating slice-specific behaviors like `make`, `len`, `cap`, `append`, and sub-slicing.*
- **Maps:** Go maps (`map[K]V`) are translated to TypeScript's standard `Map<K, V>` objects. Various Go map operations are mapped as follows:
    -   **Creation (`make`):** `make(map[K]V)` is translated using a runtime helper:
        ```go
        m := make(map[string]int)
        ```
        becomes:
        ```typescript
        import * as goscript from "@go/builtin"
        let m = goscript.makeMap<string, number>() // Using generics for type information
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
        goscript.mapSet(m, "three", 3)
        ```
    -   **Access (`m[k]`):** Uses the standard `Map.get()` method. Accessing a non-existent key in Go yields the zero value for the value type. In TypeScript, `Map.get()` returns `undefined` for non-existent keys, so the translation must ensure the correct zero value is returned (this might involve runtime checks or type information).
        ```go
        val := m["one"] // Assuming m["one"] exists
        zero := m["nonexistent"] // Assuming m["nonexistent"] doesn't exist
        ```
        becomes (simplified conceptual translation):
        ```typescript
        let val = m.get("one")
        let zero = m.get("nonexistent") ?? 0 // Provide zero value (0 for int) if undefined
        ```
    -   **Comma-Ok Idiom (`v, ok := m[k]`):** Translated using `Map.has()` and `Map.get()` with zero-value handling:
        ```go
        v, ok := m["three"]
        ```
        becomes:
        ```typescript
        let v: number
        let ok: boolean
        ok = m.has("three")
        v = m.get("three") ?? 0 // Provide zero value if key doesn't exist
        ```
    -   **Length (`len(m)`):** Uses a runtime helper `len`:
        ```go
        size := len(m)
        ```
        becomes:
        ```typescript
        let size = goscript.len(m) // Uses runtime helper, not Map.size directly
        ```
    -   **Deletion (`delete(m, k)`):** Uses a runtime helper `deleteMapEntry`:
        ```go
        delete(m, "two")
        ```
        becomes:
        ```typescript
        goscript.deleteMapEntry(m, "two")
        ```
    -   **Iteration (`for k, v := range m`):** Uses standard `Map.entries()` and `for...of`:
        ```go
        for key, value := range m {
            // ...
        }
        ```
        becomes:
        ```typescript
        for (const [key, value] of m.entries()) {
            // ...
        }
        ```
    *Note: The reliance on runtime helpers (`@go/builtin`) is crucial for correctly emulating Go's map semantics, especially regarding zero values and potentially type information for `makeMap`.*
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
            public Value(): number { const c = this; return c.count; }
            public Inc(): void    { const c = this; c.count++; }
            // ... constructor, clone ...
        }
        ```
    -   **Method Calls:** Go allows calling pointer-receiver methods on values (`value.PtrMethod()`) and value-receiver methods on pointers (`ptr.ValueMethod()`) via automatic referencing/dereferencing. In TypeScript, method calls are made directly on the class instance (which represents either the Go value or the non-null Go pointer).
        ```go
        var c Counter
        var p *Counter = &c
        _ = c.Value() // OK
        _ = p.Value() // OK (Go implicitly dereferences p)
        c.Inc()       // OK (Go implicitly takes address of c)
        p.Inc()       // OK
        ```
        becomes:
        ```typescript
        let c = new Counter().clone()
        let p: Counter | null = c // p references the same object as c initially
        c.Value() // OK
        p?.Value() // OK (requires null check for pointer types)
        c.Inc()    // OK
        p?.Inc()   // OK (requires null check for pointer types)
        ```
        *Note: The optional chaining (`?.`) is generally required when calling methods on variables representing Go pointers (mapped to `T | null`). However, if the compiler can determine that a pointer variable is definitely not `null` at the point of call (e.g., immediately after initialization via `p := &T{...}` or immediately after a pointer assignment where the source is known to be non-null), the `?.` may be omitted for optimization.*
    -   **Receiver Binding:** As per Code Generation Conventions, the Go receiver identifier (e.g., `c`) is bound to `this` within the method body (`const c = this`).
    -   **Semantic Note on Value Receivers:** In Go, a method with a value receiver operates on a *copy* of the struct. The current TypeScript translation defines the method directly on the class. If a value-receiver method modifies the receiver's fields, the TypeScript version will modify the *original* object referenced by `this`, differing from Go's copy semantics. This is an area for potential future refinement if strict copy-on-call semantics for value receivers are required. (The `clone()` method handles copy-on-assignment, not copy-on-method-call).

## Value Semantics

Go's value semantics (where assigning a struct copies it) are emulated in TypeScript by:
1. Adding a `clone()` method to generated classes.
2. Automatically calling `.clone()` during assignment statements (`=`, `:=`) whenever the right-hand side evaluates to a struct *value* (e.g., assigning from a variable, a composite literal `T{...}`, a dereferenced pointer `*p`, or the result of a function call returning a struct value). This requires type information during compilation.
3. *Note:* Assigning a pointer variable to another pointer variable (e.g., `p2 := p1`) does *not* trigger `.clone()` as this maintains Go's reference semantics for pointers.

## Multi-Assignment Statements

Go's multi-assignment statements (where multiple variables are assigned in a single statement) are translated into separate TypeScript assignments:

```go
a, b, c := val1, val2, val3
```

becomes:

```typescript
let a = val1
let b = val2
let c = val3
```

The blank identifier (`_`) in Go results in the omission of the corresponding assignment in TypeScript:

```go
x, _, z := val1, val2, val3
```

becomes:

```typescript
let x = val1
let z = val3
```

## Operators

Go operators are generally mapped directly to their TypeScript equivalents:

- **Arithmetic Operators:** `+`, `-`, `*`, `/`, `%` map directly to the same operators in TypeScript.
- **Comparison Operators:** `==`, `!=`, `<`, `<=`, `>`, `>=` map directly to the same operators in TypeScript.
- **Logical Operators:** `&&`, `||`, `!` map directly to the same operators in TypeScript.

## Control Flow: Basic `for` Loops

Go's C-style `for` loops translate directly to their TypeScript equivalents:

-   **Three-Part Loop:**
    ```go
    for i := 0; i < 10; i++ {
        // body
    }
    ```
    becomes:
    ```typescript
    for (let i = 0; i < 10; i++) {
        // body
    }
    ```

-   **Condition-Only Loop (while):**
    ```go
    for condition {
        // body
    }
    ```
    becomes:
    ```typescript
    for (; condition; ) {
        // body
    }
    ```
    *Note: This is semantically equivalent to a `while` loop in other languages.*

-   **Infinite Loop:**
    ```go
    for {
        // body
    }
    ```
    becomes:
    ```typescript
    for (;;) {
        // body
    }
    ```

## Control Flow: `for range` Loops

Go's `for range` construct is translated differently depending on the type being iterated over:

-   **Slices and Arrays:** `for range` over slices (`[]T`) or arrays (`[N]T`) is translated into a standard TypeScript C-style `for` loop:
    ```go
    items := []string{"a", "b", "c"}
    for i, item := range items {
        // ... use i and item
    }
    for _, item := range items {
        // ... use item only
    }
    ```
    becomes:
    ```typescript
    let items = ["a", "b", "c"]
    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        { // New scope for loop body variables
            // ... use i and item
        }
    }
    for (let i = 0; i < items.length; i++) { // Index 'i' still generated
        const item = items[i]
        { // New scope for loop body variables
            // ... use item only
        }
    }
    ```
    *Note: A new block scope `{}` is introduced for the loop body to correctly emulate Go's per-iteration variable scoping for `item` (and `i` if captured).*

-   **Maps:** `for range` over maps (`map[K]V`) uses the `Map.entries()` iterator (as shown previously in the Maps section):
    ```go
    m := map[string]int{"one": 1}
    for k, v := range m {
        // ...
    }
    ```
    becomes:
    ```typescript
    let m = new Map([["one", 1]])
    for (const [k, v] of m.entries()) {
        // ...
    }
    ```

-   **Strings:** `for range` over strings iterates over Unicode code points (runes). This is translated using a runtime helper `stringToRunes` and a C-style `for` loop:
    ```go
    str := "go"
    for i, r := range str {
        // i is byte index, r is rune (int32)
    }
    ```
    becomes:
    ```typescript
    import * as goscript from "@go/builtin"
    let str = "go"
    const _runes = goscript.stringToRunes(str) // Convert to array of runes (numbers)
    for (let i = 0; i < _runes.length; i++) { // i is rune index here
        const r = _runes[i] // r is rune (number)
        {
            // ... use i and r
        }
    }
    ```
    *Note: The index `i` in the generated TypeScript loop corresponds to the *rune index*, not the byte index as in Go's `for range` over strings.*

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
import * as goscript from "@go/builtin"

await goscript.selectStatement([
    {
        id: 0,  // Unique identifier for this case
        isSend: false,  // This is a receive operation
        channel: ch1,
        onSelected: async (result) => {
            const val = result.value
            const ok = result.ok
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

-   **`if` with Short Statement:** Go allows an optional short statement (typically variable initialization) before the condition. The scope of variables declared in the short statement is limited to the `if` (and any `else if`/`else`) blocks. This is translated by declaring the variable before the `if` statement in TypeScript, often within an immediately-invoked function expression (IIFE) or a simple block to mimic the limited scope if necessary, although simpler translations might place the variable in the outer scope if no name conflicts arise.
    ```go
    if v := computeValue(); v > 10 {
        // use v
    } else {
        // use v
    }
    // v is not accessible here
    ```
    becomes (conceptual translation, potentially simplified):
    ```typescript
    { // Optional block to limit scope
        const v = computeValue()
        if (v > 10) {
            // use v
        } else {
            // use v
        }
    }
    // v is not accessible here (if block scope is used)
    ```
    *Note: Precise scoping might require careful handling, especially if the initialized variable shadows an outer variable.*

## Zero Values

Go's zero values are mapped as follows:
- `number`: `0`
- `string`: `""`
- `boolean`: `false`
- `struct`: `new TypeName()`
- `pointer`, `interface`, `slice`, `map`, `channel`, `function`: `null`

## Packages and Imports

- Go packages are mapped to TypeScript modules under the `@go/` scope (e.g., `import { MyType } from '@go/my/package';`).
- The GoScript runtime is imported using the `@go/builtin` alias, which maps to the `builtin/builtin.ts` file.
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

### Channel Operations

Channel operations are translated as follows:

-   **Creation:** `make(chan T, capacity)` is translated to `goscript.makeChannel<T>(capacity, zeroValueOfTypeT)`. For unbuffered channels (`make(chan T)`), the capacity is `0`.
-   **Receive:** `val := <-ch` is translated to `val = await ch.receive()`.
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
import * as goscript from "@go/builtin";

// Marked async because it contains 'await ch.receive()'
async function receiveFromChan(ch: goscript.Channel<number>): Promise<number> {
	let val = await ch.receive()
	return val
}

// Marked async because it calls the async 'receiveFromChan'
async function caller(ch: goscript.Channel<number>): Promise<number> {
	let result = await receiveFromChan(ch) // Call is awaited
	return result + 1
}

// Marked async because it calls the async 'caller' and uses 'await myChan.send()'
export async function main(): Promise<void> {
	let myChan = goscript.makeChannel<number>(1, 0)
	await myChan.send(10) // Send is awaited
	let finalResult = await caller(myChan) // Call is awaited
	console.log(finalResult)
	myChan.close()
}
```

*Note on Microtasks:* While Go's concurrency model involves goroutines and a scheduler, the TypeScript translation primarily uses `async`/`await` and Promises for channel operations. Starting a new Goroutine with the `go` keyword is translated to a call to `queueMicrotask` with the target function, effectively scheduling it to run asynchronously similar to how Promises resolve.

## Constants

Go `const` declarations are translated into TypeScript `let` declarations at the module scope.

```go
const Pi = 3.14
const Greeting = "Hello"
```

becomes:

```typescript
let Pi = 3.14
let Greeting = "Hello"
```

*Note: Handling of untyped constants and potential precision issues with large numbers or complex constant expressions is an area for future refinement.*

## Multiple Return Values

Go functions that return multiple values are translated into TypeScript functions that return a tuple (an array with fixed element types).

```go
func swap(x, y string) (string, string) {
    return y, x
}

a, b := swap("hello", "world")
first, _ := swap("one", "two") // Ignore second value
```

becomes:

```typescript
function swap(x: string, y: string): [string, string] {
    return [y, x]
}

let [a, b] = swap("hello", "world")
let [first, ] = swap("one", "two") // Ignore second value via destructuring hole
```

Assignment from function calls returning multiple values uses TypeScript's array destructuring syntax. The blank identifier `_` in Go corresponds to omitting the variable name in the TypeScript destructuring pattern.
