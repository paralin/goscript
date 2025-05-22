# Design: `[]byte` as `Uint8Array` and Runtime Helper Modifications

## 1. Introduction and Goal

Currently, Go's `[]byte` type is transpiled to `$.Slice<number>` in TypeScript. While functional, this representation is not semantically ideal for byte operations and can lead to inefficiencies or type incompatibilities when interacting with Web APIs that expect `Uint8Array` (e.g., `TextEncoder`, `TextDecoder`, WebAssembly interfaces).

The primary goal of this refactoring is to change the default TypeScript representation of Go's `[]byte` to `Uint8Array`. This change aims to:
- Improve semantic correctness for byte slices.
- Enhance interoperability with browser/Node.js APIs that work with binary data.
- Potentially improve performance and memory usage for byte operations.

A crucial part of this change is ensuring that the GoScript runtime helper functions in `gs/builtin/builtin.ts` (such as `$.len`, `$.cap`, `$.append`, `$.goSlice`, `$.copy`, `$.stringToBytes`, `$.bytesToString`) are updated to seamlessly support `Uint8Array` as the representation for `[]byte`, while also maintaining compatibility with existing `number[]` and `$.Slice<number>` types where appropriate (i.e., when the slice element type is `number`).

## 2. Type Mapping Changes

The following type mappings will be adopted:

-   **Go `byte`**: Maps to TypeScript `number`. (No change)
-   **Go `[]byte`**: Maps to TypeScript `Uint8Array`. (New primary change)
-   **Go `[]T` (other slice types)**: Continue to map to `$.Slice<T>`. (No change)

## 3. Runtime Helper Modifications in `gs/builtin/builtin.ts`

The runtime helper functions will be modified as follows to accommodate `Uint8Array` for `[]byte`.

### `$.Slice<T>` Type Definition
The core `$.Slice<T>` type will remain:
`export type Slice<T> = T[] | SliceProxy<T> | null`

`Uint8Array` will be treated as a distinct type. Functions operating on numerical slices (like `$.len`, `$.append` when `T` is `number`) will be augmented to explicitly recognize and handle `Uint8Array` instances. This approach is preferred over adding `Uint8Array` directly to the `Slice<number>` union type to maintain clarity and type specificity.

### `$.len(s: any): number`
-   If `s` is an instance of `Uint8Array`, `$.len(s)` will return `s.length`.
-   Existing functionality for `string`, `Array<T>`, `Slice<T>`, `Map`, and `Set` will be preserved.

### `$.cap(s: any): number`
-   If `s` is an instance of `Uint8Array`, `$.cap(s)` will return `s.length`. This reflects the fact that a standard JavaScript `Uint8Array` does not have a separate capacity distinct from its length.
-   Existing functionality for `Slice<T>` (which uses `__meta__.capacity`) and `T[]` (where capacity is treated as equal to length) will be preserved.

### `$.append(slice: any, ...elements: any[]): any`
This function will be significantly updated to handle various combinations involving `Uint8Array`.

-   **Input `slice` types:** Can be `$.Slice<number>`, `number[]`, or `Uint8Array`.
-   **Input `elements` types:**
    -   Individual `number`s (byte values).
    -   `$.Slice<number>`, `number[]`, or `Uint8Array` when appending multiple elements from another slice or array.
-   **Return Type Strategy:**
    -   If the initial `slice` is `Uint8Array`, `$.append` will always return a new `Uint8Array`.
    -   If the initial `slice` is `$.Slice<number>` or `number[]`, and any of the `elements` to be appended is a `Uint8Array`, the numeric values from the `Uint8Array` will be appended, and the function will return `$.Slice<number>` (respecting Go's slice reallocation semantics).
    -   Otherwise, the existing behavior for `$.Slice<T>` will be maintained.
-   **Behavior:**
    -   Capacity management: When appending to a `Uint8Array` and the operation exceeds its current length (which is also its capacity), a new, larger `Uint8Array` will be allocated, and its contents copied, similar to Go's slice reallocation.
    -   Numeric values from all supported input types will be correctly appended.

### `$.makeSlice<T>(length: number, capacity?: number): Slice<T> | Uint8Array`
-   When the compiler encounters `make([]byte, len, cap)`:
    -   The generated TypeScript code will result in `new Uint8Array(length)`.
    -   The `cap` argument from Go's `make` will be used for `length` if `length` itself is not specified (e.g. `make([]byte, 0, 5)` results in `new Uint8Array(0)` but with a conceptual capacity of 5, though the JS object is length 0). For `Uint8Array`, the constructor takes a single `length` argument. The GoScript runtime will produce `new Uint8Array(length)`. The `capacity` argument will be respected by `$.cap` if the `makeSlice` for `[]byte` returns a `SliceProxy<number>` backed by a `Uint8Array`, or if `$.cap` has special logic for `Uint8Array`s known to be created from `make([]byte, len, cap)`.
    -   As per `WIP.md` ("Update `make([]byte, len, cap)` to return `Uint8Array`"), the direct approach is `new Uint8Array(length)`, meaning `$.cap` on such an object will return its `length`.
-   For other types `T` (not `byte`), `$.makeSlice` will continue to return `$.Slice<T>`.

### `$.goSlice(s: any, low?: number, high?: number, max?: number): any`
-   If `s` is an instance of `Uint8Array`:
    -   The function will return `s.subarray(low, high)`. This creates a new view on the same underlying `ArrayBuffer`.
    -   The `max` parameter (Go's way of specifying the capacity of the resulting slice) does not directly translate to a property of the `Uint8Array` returned by `subarray`. The `length` of the returned `Uint8Array` will be `high - low`. `$.cap` on this resulting subarray will return its `length`.
-   Existing behavior for `$.Slice<T>` will be preserved.

### `$.stringToBytes(s: string): Uint8Array`
-   This function will be implemented to convert a TypeScript `string` into a `Uint8Array`.
-   It will use `TextEncoder().encode(s)`.

### `$.bytesToString(b: Uint8Array): string`
-   This function will take a `Uint8Array` as input.
-   It will convert the `Uint8Array` into a TypeScript `string` using `TextDecoder().decode(b)`.

### `$.copy(dst: any, src: any): number`
-   This function will be updated to correctly handle cases where `dst` and/or `src` are `Uint8Array`.
-   It will also continue to support `$.Slice<number>` and `number[]` for `dst` and `src`.
-   **Behavior:**
    -   If `dst` is `Uint8Array` and `src` is `Uint8Array`, `dst.set(src.subarray(0, count))` will be used for efficient copying.
    -   If `dst` is `Uint8Array` and `src` is `number[]` or `$.Slice<number>`, elements will be copied individually.
    -   If `dst` is `number[]` or `$.Slice<number>` and `src` is `Uint8Array`, elements will be copied individually.
-   The number of elements copied will be the minimum of `$.len(dst)` and `$.len(src)`.

## 4. Compiler Adjustments (High-Level Overview)

The GoScript compiler will require modifications to emit TypeScript code that aligns with these runtime changes. For detailed compiler changes, refer to the `WIP.md` document. Key areas of impact include:

-   **`compiler/type.go`**:
    -   `WriteSliceType`: To emit `Uint8Array` for `[]byte`.
    -   `WriteZeroValueForType`: To emit `new Uint8Array(0)` as the zero value for `[]byte`.
-   **`compiler/expr-call.go`**:
    -   `WriteCallExpr`: To handle `make([]byte, ...)` by generating `new Uint8Array(...)`.
    -   To correctly transpile `string()` conversions to `$.bytesToString` and `[]byte()` conversions to `$.stringToBytes`.
-   **`compiler/expr.go`**:
    -   `WriteSliceExpr`: To ensure slicing operations on `[]byte` (now `Uint8Array`) use appropriate methods (e.g., leading to `$.goSlice` which uses `subarray`).
-   **`compiler/composite-lit.go`**:
    -   `WriteCompositeLit`: To transpile `[]byte{...}` literals to `new Uint8Array([...])`.
-   **`compiler/stmt-range.go`**:
    -   `WriteStmtRange`: To correctly iterate over `Uint8Array` when ranging over `[]byte`.

## 5. Interoperability Notes

-   **Type Safety:** Functions in TypeScript that are typed to accept `$.Slice<number>` or `number[]` will not implicitly accept `Uint8Array` without explicit updates to their type signatures or runtime checks within the GoScript helper functions. The compiler's output and the runtime helpers will manage these distinctions.
-   **Goal:** The primary representation for `[]byte` will be `Uint8Array`. The runtime helpers will provide the necessary polymorphic behavior or conversions to ensure that Go's slice semantics are respected as closely as possible.
-   **External APIs:** Using `Uint8Array` directly will simplify interaction with many JavaScript APIs that deal with binary data, reducing the need for intermediate conversions.
