# GoScript Compliance Tests

This document outlines the compliance tests for the GoScript compiler, verifying its ability to correctly translate various Go language features into TypeScript.

## Existing Compliance Tests

The following tests are currently implemented in the `/compliance/tests` directory:

*   **`array_literal/`**: Tests array literal creation and indexing.
*   **`async_basic/`**: Verifies basic goroutine (`go func()`) translation using `async`/`await`.
*   **`async_defer_statement/`**: Tests `defer` statements containing async operations (channel ops), ensuring correct use of `AsyncDisposableStack` and `async` callbacks.
*   **`basic_arithmetic/`**: Verifies basic arithmetic operations (`+`, `-`, `*`, `/`, `%`).
*   **`boolean_logic/`**: Tests boolean logic operators (`&&`, `||`, `!`) and comparisons (`==`, `!=`, `<`, `>`, `<=`, `>=`).
*   **`channel_basic/`**: Covers basic channel operations (make, send, receive, close) for unbuffered channels.
*   **`composite_literal_assignment/`**: Checks the assignment of struct values created using composite literals, ensuring correct value copying.
*   **`constants/`**: Tests basic constant declarations and usage.
*   **`copy_independence/`**: Verifies that copies of struct values are independent and modifications to one do not affect others.
*   **`float64/`**: Tests basic operations with `float64` types.
*   **`for_loop_basic/`**: Verifies basic counter-based `for` loops (`for init; cond; post {}`).
*   **`for_loop_condition_only/`**: Verifies `for` loops with only a condition (`for cond {}`).
*   **`for_range/`**: Tests `for range` loops over slices and maps (key-value).
*   **`for_range_index_use/`**: Tests `for range` loops over slices where the index is explicitly used.
*   **`func_literal/`**: Verifies the translation of function literals (closures).
*   **`for_loop_infinite/`**: Verifies infinite `for {}` loops and the `break` statement.
*   **`function_call_result_assignment/`**: Tests assigning the result of a function returning a struct, ensuring proper value semantics (copying).
*   **`if_statement/`**: Covers basic `if`/`else` conditional statements, including correct `} else {` formatting.
*   **`interface_to_interface_type_assertion/`**: Tests type assertions from one interface type to another.
*   **`interface_type_assertion/`**: Tests type assertions from an interface type to a concrete type (`v.(T)`).
*   **`embedded_interface_assertion/`**: Tests type assertions involving embedded interfaces.
*   **`interface_multi_param_return/`**: Tests interface method signatures with multiple parameters (named/unnamed) and multiple return values, including `nil` translation.
*   **`map_support/`**: Covers map creation (`make`, literal), access, assignment, deletion, length, and iteration (`range`).
*   **`method_call_on_pointer_receiver/`**: Verifies calling methods with pointer receivers (`*T`) on pointer variables.
*   **`method_call_on_pointer_via_value/`**: Verifies calling methods with pointer receivers (`*T`) on value variables (Go implicitly takes the address).
*   **`method_call_on_value_receiver/`**: Verifies calling methods with value receivers (`T`) on value variables.
*   **`method_call_on_value_via_pointer/`**: Verifies calling methods with value receivers (`T`) on pointer variables (Go implicitly dereferences).
*   **`multiple_return_values/`**: Tests functions returning multiple values and their assignment.
*   **`pointer_assignment_no_copy/`**: Verifies that assigning pointers copies the pointer (address), not the underlying value.
*   **`pointer_composite_literal_assignment/`**: Checks assignment involving pointers to struct composite literals.
*   **`pointer_deref_multiassign/`**: Tests dereferencing a pointer during a multi-variable assignment (`:=` or `=`), including the use of the blank identifier (`_`).
*   **`pointer_initialization/`**: Checks the initialization of pointer variables using the address-of operator (`&`) or `new()`.
*   **`select_receive_on_closed_channel_no_default/`**: Tests `select` behavior when receiving from a closed channel without a default case.
*   **`select_send_on_full_buffered_channel_with_default/`**: Tests `select` behavior when sending to a full buffered channel with a default case.
*   **`select_statement/`**: Verifies basic `select` statements for channel communication.
*   **`simple/`**: A basic test covering simple struct definition, field access, method calls, and `println`.
*   **`simple_deref_assignment/`**: Tests simple assignment involving pointer dereferencing (`*ptr`), ensuring value copying.
*   **`slices/`**: Covers slice creation (`make`), length (`len`), capacity (`cap`), and appending (`append`).
*   **`string_conversion/`**: Tests the conversion between `string` and `rune` and `[]rune`.
*   **`struct_field_access/`**: Verifies accessing fields of struct values and struct pointers.
*   **`struct_value_init_clone/`**: Checks struct initialization via composite literal (`T{...}`) and subsequent assignment (ensuring `.clone()` is used).
*   **`switch_statement/`**: Verifies basic `switch` statements with integer and string tags and default cases.
*   **`value_type_copy_behavior/`**: Focuses specifically on demonstrating that assigning struct values creates independent copies (value semantics).

Each test should have only three files:

1. test_name.go - the Go code to convert to TypeScript
2. test_name.gs.ts - the generated TypeScript code, created automatically on test run
3. expected.log - the expected output from running the .gs.ts

## Covered Go Language Constructs

Based on the existing tests, GoScript aims to support the following Go features:

*   **Basic Types:** `int`, `string`, `bool`, `float64` (implicitly tested).
*   **Type Conversions:**
*   `string(rune)`
*   `string(string)`
*   `string([]rune)`
*   `[]rune(string)`
*   **Operators:**
    *   Arithmetic: `+`, `-`, `*`, `/`, `%`
    *   Comparison: `==`, `!=`, `<`, `>`, `<=`, `>=`
    *   Logical: `&&`, `||`, `!`
*   Bitwise operator precedence in if conditions (`&`, `|`, `^`, `<<`, `>>`, `&^`)
*   **Control Flow:**
    *   `if`/`else` statements.
    *   `defer` statement (including async operations)
    *   `switch` statements (with/without expression, type switches).
    *   `switch` statements.
    *   `select` statements (basic channel communication).
    *   `for` loops (condition-only, basic counter-based, infinite, `range` over arrays/slices/strings/maps).
*   **Data Structures:**
*   Arrays (`[N]T`) - Including array literals, indexing, and `range`.
*   Slices (`[]T`) - Including slices of slices, compliant creation using `make([]T, len)` and `make([]T, len, cap)`, `len`, `cap`, `append`, and slicing expressions (`[low:high]`, `[low:high:max]`).
*   Maps (`map[K]V`) - Creation using `make(map[K]V)` (generates `makeMap<TS_K, TS_V>()`), access, assignment, `delete`, `len`, `range`.
*   `struct` definitions (including exported/unexported fields).
    *   Struct Embedding.
    *   Composite Literals for structs (`MyStruct{...}`).
    *   Interfaces (`interface{}`) - Definition and type assertions (`v.(T)`) are now compliant, including interface-to-interface type assertions and embedded interfaces using the `extends` keyword.
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

*   **Control Flow:**
    *   `panic` / `recover`
*   **Data Structures:**
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