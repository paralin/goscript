# GoScript Compliance Tests

This document outlines the compliance tests for the GoScript compiler, verifying its ability to correctly translate various Go language features into TypeScript.

## Existing Compliance Tests

The following tests are currently implemented in the `/compliance/tests` directory:

*   **`basic_arithmetic/`**: Verifies basic arithmetic operations (`+`, `-`, `*`, `/`, `%`).
*   **`boolean_logic/`**: Tests boolean logic operators (`&&`, `||`, `!`) and comparisons (`==`, `!=`, `<`, `>`, `<=`, `>=`).
*   **`composite_literal_assignment/`**: Checks the assignment of struct values created using composite literals, ensuring correct value copying.
*   **`copy_independence/`**: Verifies that copies of struct values are independent and modifications to one do not affect others.
*   **`function_call_result_assignment/`**: Tests assigning the result of a function returning a struct, ensuring proper value semantics (copying).
*   **`if_statement/`**: Covers basic `if`/`else` conditional statements, including correct `} else {` formatting.
*   **`for_loop_basic/`**: Verifies basic counter-based `for` loops (`for init; cond; post {}`).
*   **`method_call_on_pointer_receiver/`**: Verifies calling methods with pointer receivers (`*T`) on pointer variables.
*   **`method_call_on_value_receiver/`**: Verifies calling methods with value receivers (`T`) on value variables. (Note: Go often implicitly takes the address for pointer receivers, this tests the explicit value receiver case).
*   **`pointer_deref_multiassign/`**: Tests dereferencing a pointer during a multi-variable assignment (`:=` or `=`), including the use of the blank identifier (`_`).
*   **`pointer_initialization/`**: Checks the initialization of pointer variables using the address-of operator (`&`) or `new()`.
*   **`simple/`**: A basic test covering simple struct definition, field access, method calls, and `println`. (Likely overlaps with others, could be a general integration test).
*   **`simple_deref_assignment/`**: Tests simple assignment involving pointer dereferencing (`*ptr`), ensuring value copying.
*   **`struct_field_access/`**: Verifies accessing fields of struct values and struct pointers.
*   **`value_type_copy_behavior/`**: Focuses specifically on demonstrating that assigning struct values creates independent copies (value semantics).

## Covered Go Language Constructs

Based on the existing tests, GoScript aims to support the following Go features:

*   **Basic Types:** `int`, `string`, `bool`, `float64` (implicitly tested).
    *   Constants (`const`) - Note: Handling of large integer constants (exceeding standard JavaScript number limits) is currently not fully compliant.
*   **Operators:**
    *   Arithmetic: `+`, `-`, `*`, `/`, `%`
    *   Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
    *   Logical: `&&`, `||`, `!`
*   **Control Flow:**
    *   `if`/`else` statements.
*   **Data Structures:**
    *   Arrays (`[N]T`) - Including array literals and indexing.
    *   `struct` definitions (including exported/unexported fields).
    *   Composite Literals for structs (`MyStruct{...}`).
*   **Functions & Methods:**
    *   Function definition (`func`).
    *   Method definition with value receivers (`func (v T) Method()`).
    *   Method definition with pointer receivers (`func (p *T) Method()`).
    *   Function calls.
    *   Method calls (on values and pointers).
    *   `println` built-in (mapped to `console.log`).
*   **Variables & Assignment:**
    *   Variable declaration (`var`, implicitly via `:=`).
    *   Short variable declaration (`:=`).
    *   Assignment (`=`).
    *   Multi-variable assignment.
    *   Blank identifier (`_`) in assignment.
*   **Pointers:**
    *   Pointer types (`*T`).
    *   Address-of operator (`&`).
    *   Dereference operator (`*`).
*   **Value Semantics:** Emulation of Go's struct copy-on-assignment behavior.

## Uncovered Go Language Constructs (Based on Go By Example)

The following Go constructs, present in the "Go By Example" guide, do not appear to have dedicated compliance tests yet. This list is not exhaustive but provides a starting point for future test development.

*   **Basic Types & Values:**
   *   `float32`, `float64`, `complex64`, `complex128`
   *   `rune` (and string/rune conversions)
   *   Constants (`const`) - Note: Handling of large integer constants (exceeding standard JavaScript number limits) is currently not fully compliant.
   *   `iota`
*   **Data Structures:**
    *   Slices (`[]T`, `make`, `append`, `copy`, slicing operations `s[low:high]`)
    *   Maps (`map[K]V`, `make`, `delete`)
    *   Interfaces (`interface{}`) - Definition tested, but usage (assignment, type assertions `v.(T)`) needs tests.
    *   Struct Embedding
    *   Generics (Type parameters, constraints)
*   **Control Flow:**
    *   `for` loops (basic counter-based covered; `range`, condition-only, infinite still uncovered)
    *   `switch` statements (with/without expression, type switches)
    *   `select` statement (for channel operations)
    *   `defer` statement
    *   `panic` / `recover`
    *   `goto` (less common, but part of the language)
*   **Concurrency:**
    *   Goroutines (`go func()`)
    *   Channels (`chan T`, `make`, send `<-`, receive `<-`, buffered/unbuffered, closing)
    *   Mutexes (`sync.Mutex`)
    *   WaitGroups (`sync.WaitGroup`)
    *   Atomic Counters (`sync/atomic`)
    *   Rate Limiting concepts
    *   Worker Pools
    *   Stateful Goroutines
*   **Functions:**
    *   Multiple return values (definition tested, but assignment/usage needs more)
    *   Variadic functions (`...T`)
    *   Closures
    *   Recursion
*   **Packages & Imports:**
    *   Import aliasing (`import alias "path"`)
    *   Dot imports (`import . "path"`) - Generally discouraged.
    *   Handling standard library packages (e.g., `fmt`, `math`, `time`, `os`, `net/http`, `encoding/json`, `regexp`, etc.) - Requires runtime shims or direct translation.
*   **Error Handling:**
    *   `error` interface usage
    *   Custom error types
*   **Input/Output & System:**
    *   File I/O (`os.ReadFile`, `os.WriteFile`, etc.)
    *   Command-line arguments/flags (`os.Args`, `flag` package)
    *   Environment variables (`os.Getenv`)
    *   Executing processes (`os/exec`)
    *   Signals (`os/signal`)
    *   Context (`context`)
*   **Reflection:** (`reflect` package) - Likely out of scope for direct translation.
*   **Testing:** (`testing` package) - Test files themselves are usually not translated.
*   **Directives:**
    *   `//go:embed`

This list helps identify areas where GoScript's feature coverage can be expanded and verified through new compliance tests.