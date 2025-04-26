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
*   **`switch_statement/`**: Verifies basic `switch` statements with integer and string tags and default cases.
*   **`for_loop_basic/`**: Verifies basic counter-based `for` loops (`for init; cond; post {}`).
*   **`for_loop_condition_only/`**: Verifies `for` loops with only a condition (`for cond {}`).
*   **`map_support/`**: Covers map creation (`make`, literal), access, assignment, deletion, length, and iteration (`range`).
*   **`method_call_on_pointer_receiver/`**: Verifies calling methods with pointer receivers (`*T`) on pointer variables.
*   **`method_call_on_value_receiver/`**: Verifies calling methods with value receivers (`T`) on value variables. (Note: Go often implicitly takes the address for pointer receivers, this tests the explicit value receiver case).
*   **`pointer_deref_multiassign/`**: Tests dereferencing a pointer during a multi-variable assignment (`:=` or `=`), including the use of the blank identifier (`_`).
*   **`pointer_initialization/`**: Checks the initialization of pointer variables using the address-of operator (`&`) or `new()`.
*   **`simple/`**: A basic test covering simple struct definition, field access, method calls, and `println`. (Likely overlaps with others, could be a general integration test).
*   **`simple_deref_assignment/`**: Tests simple assignment involving pointer dereferencing (`*ptr`), ensuring value copying.
*   **`struct_field_access/`**: Verifies accessing fields of struct values and struct pointers.
*   **`struct_value_init_clone/`**: Checks struct initialization via composite literal (`T{...}`) (omitting `.clone()` for direct assignment) and subsequent assignment from variables (ensuring `.clone()` is used for value semantics).
*   **`value_type_copy_behavior/`**: Focuses specifically on demonstrating that assigning struct values creates independent copies (value semantics).

Each test should have only three files:

1. test_name.go - the Go code to convert to TypeScript
2. test_name.gs.ts - the generated TypeScript code, created automatically on test run
3. expected.log - the expected output from running the .gs.ts

## Covered Go Language Constructs

Based on the existing tests, GoScript aims to support the following Go features:

*   **Basic Types:** `int`, `string`, `bool`, `float64` (implicitly tested).
*   **Type Conversions:** `string(rune)`
*   **Operators:**
    *   Arithmetic: `+`, `-`, `*`, `/`, `%`
    *   Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
    *   Logical: `&&`, `||`, `!`
*   **Control Flow:**
    *   `if`/`else` statements.
    *   `switch` statements.
    *   `select` statement.
    *   `for` loops (condition-only, basic counter-based, `range` over arrays/slices/strings).
*   **Data Structures:**
    *   Arrays (`[N]T`) - Including array literals and indexing.
    *   Slices (`[]T`) - Creation using `make([]T, len)` and `make([]T, len, cap)`.
    *   Maps (`map[K]V`) - Creation using `make(map[K]V)` (generates `makeMap<TS_K, TS_V>()`), literals, access, assignment, `delete`, `len`, `range`.
    *   `struct` definitions (including exported/unexported fields).
    *   Composite Literals for structs (`MyStruct{...}`).
*   **Functions & Methods:**
    *   Function definition (`func`).
    *   Function Literals (`func() { ... }`)
    *   Method definition with value receivers (`func (v T) Method()`).
    *   Method definition with pointer receivers (`func (p *T) Method()`).
    *   Function calls.
    *   Method calls (on values and pointers).
    *   `println` built-in (mapped to `console.log`).
    *   Multiple return values (including assignment and usage with blank identifier).
    *   Asynchronous Functions (`async`/`await` based on channel operations)
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
*   **Concurrency:**
    *   Goroutines (`go func()`)
    *   Channels (`chan T`, `make`, send `<-`, receive `<-`, buffered/unbuffered, closing)

## Uncovered Go Language Constructs (Based on Go By Example)

The following Go constructs, present in the "Go By Example" guide, do not appear to have dedicated compliance tests yet. This list is not exhaustive but provides a starting point for future test development.

*   Interfaces (`interface{}`) - Definition tested, and type assertions (`v.(T)`) are now compliant, including interface-to-interface type assertions.
*   **Control Flow:**
    *   `for` loops (infinite still uncovered)
    *   `switch` statements (with/without expression, type switches)
    *   `select` statement (for channel operations)
    *   `defer` statement
    *   `panic` / `recover`
*   **Data Structures:**
    *   Struct Embedding
*   **Functions:**
    *   Variadic functions (`...T`)
    *   Closures
    *   Recursion
*   **Basic Types & Values:**
   *   `iota` consts
*   **Concurrency:**
    *   Mutexes (`sync.Mutex`)
*   **Error Handling:**
    *   `error` interface usage
*   **Packages & Imports:**
    *   Import aliasing (`import alias "path"`)

This list helps identify areas where GoScript's feature coverage can be expanded and verified through new compliance tests.

## Ignored or Not-planned Go Language Constructs

These are the not-planned features that we should NOT waste time adding yet:

* complex number support (complex64, etc.)
*   **Reflection:** (`reflect` package) - Likely out of scope for direct translation.
*   **Testing:** (`testing` package) - Test files themselves are usually not translated.
*   Constants (`const`) - handling of large integer constants (exceeding standard JavaScript number limits) is currently not fully compliant.
*   Generics (Type parameters, constraints)
*   `goto` (less common, but part of the language)
*   **Directives:**
    *   `//go:embed`
*   Dot imports (`import . "path"`) - Generally discouraged.
*   Handling standard library packages (e.g., `fmt`, `math`, `time`, `os`, `net/http`, `encoding/json`, `regexp`, etc.) - Requires runtime shims or direct translation.
*   **Input/Output & System:**
    *   File I/O (`os.ReadFile`, `os.WriteFile`, etc.)
    *   Command-line arguments/flags (`os.Args`, `flag` package)
    *   Environment variables (`os.Getenv`)
    *   Executing processes (`os/exec`)
    *   Signals (`os/signal`)
    *   Context (`context`)
*   WaitGroups (`sync.WaitGroup`)
*   Atomic Counters (`sync/atomic`)
*   Rate Limiting concepts
*   Worker Pools
*   Stateful Goroutines