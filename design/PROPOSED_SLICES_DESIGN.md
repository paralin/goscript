────────────────────────────────────────
**Go-Slice Emulation in TypeScript**
────────────────────────────────────────

**1. Overview**

This document outlines the design for emulating Go's slice behavior in TypeScript. The primary goal is to provide a `Slice<T>` type that closely mimics Go's `[]T`, including its dynamic resizing, capacity management, and sub-slicing semantics. This is achieved through a combination of a core public type, an internal proxy representation for complex slice views, and a set of helper functions.

**Key Design Principles:**
*   **Performance for Simple Cases:** Operations on slices that map directly to a full underlying JavaScript array (offset 0, length equals capacity equals backing array length) should incur minimal overhead.
*   **Go Semantics Preservation:** Slice operations like sub-slicing (`s[lo:hi]`, `s[lo:hi:max]`), `append`, and `copy` should behave as they do in Go, particularly concerning shared backing arrays and capacity.
*   **User Transparency:** The distinction between a simple array view and a proxied view should be largely opaque to the end-user programming against `Slice<T>`.
*   **No Prototype Pollution:** `Array.prototype` will not be modified.
*   **Tree-Shakeable:** Helper functions will be structured to allow bundlers to remove unused slice functionality.

**2. Core Public Type**

```typescript
/**
 * Represents a Go-like slice.
 * It can be a simple JavaScript array or a proxy for more complex views.
 * This is the 1:1 equivalent of Go’s `[]T`.
 */
export type Slice<T> = T[] | SliceProxy<T>;
```
*   When the slice view is "simple" (i.e., offset 0, `len === cap === backingArray.length`), a plain JavaScript `T[]` is used for optimal performance.
*   Any divergence from this simple view (e.g., due to sub-slicing with `goSlice`, manual capacity setting with `makeSlice`, or `append` operations that re-allocate or extend within capacity) results in the use of a `SliceProxy<T>`.

**3. Internal Representation**

Two key internal structures define how slices are managed:

```typescript
/**
 * Hidden metadata object that stores the Go-specific properties of a slice.
 * This object is held by SliceProxy instances.
 */
interface GoSliceObject<T> {
  readonly backing: T[];   // The shared JavaScript array storing the actual data.
  readonly offset: number; // The starting index of this slice within the 'backing' array.
  readonly len:    number; // The visible length of the slice (number of elements).
  readonly cap:    number; // The available capacity of the slice (len <= cap).
                           // (offset + cap <= backing.length)
}

/**
 * The proxy type that user code interacts with when a slice isn't a simple T[].
 * It provides Go-like indexed access, length, and selected array methods.
 */
export type SliceProxy<T> = {
  /**
   * Indexed access for reading and writing elements.
   * Enforces Go-style bounds checking (panic on out-of-bounds for read,
   * specific behavior for write at 'len' if 'len < cap').
   */
  [k: number]: T;

  /**
   * Read-only property mirroring Go’s `len()` function.
   * Reflects the current number of accessible elements in the slice.
   */
  readonly length: number;

  /** Standard array helper methods, operating on the visible slice view. */
  map<U>(callbackfn: (value: T, index: number, slice: SliceProxy<T>) => U): U[];
  filter(predicate: (value: T, index: number, slice: SliceProxy<T>) => boolean): T[];
  reduce<U>(
    callbackfn: (previousValue: U, currentValue: T, currentIndex: number, slice: SliceProxy<T>) => U,
    initialValue: U
  ): U;
  forEach(callbackfn: (value: T, index: number, slice: SliceProxy<T>) => void): void;
  [Symbol.iterator](): IterableIterator<T>;

  /**
   * Standard JavaScript `slice` method.
   * Returns a *new, plain JavaScript array* containing a shallow copy of the
   * elements within the specified range of the Go slice's visible part.
   * This does NOT return a Go `Slice<T>`.
   */
  slice(start?: number, end?: number): T[];

  /**
   * Internal property holding the GoSliceObject metadata.
   * This is not intended for direct user access and will not be exposed in .d.ts files
   * shipped to users, but is crucial for the proxy's and helper functions' operations.
   */
  readonly __meta__: GoSliceObject<T>;
};
```

**Implementation Note on `SliceProxy<T>`:**
`SliceProxy<T>` instances are created using `new Proxy(target, handler)`.
*   The `target` is a lightweight object, often just containing the `__meta__` data or being the conceptual slice itself.
*   The `handler` (see Section 6: Proxy Behaviour) intercepts property access:
    *   Numeric indices are mapped to `__meta__.backing` using `__meta__.offset`, with bounds checking.
    *   `"length"` reads return `__meta__.len`.
    *   Recognized array helper methods are bound to operate on the logical view `__meta__.backing.slice(__meta__.offset, __meta__.offset + __meta__.len)`.
    *   Access to `__meta__` is provided directly.

**4. Helper Runtime (`builtin.ts`)**

All Go slice operations are implemented as helper functions, typically within a dedicated namespace (e.g., `$` or `builtin`).

```typescript
export namespace $ { // Or other suitable namespace like 'builtin'
  /**
   * Creates a new slice, analogous to Go’s `make([]T, len, cap)`.
   * @param len The desired length of the slice.
   * @param cap Optional. The desired capacity. Defaults to `len`.
   * @param zeroCtor Optional. A factory function to produce the zero-value for
   *                 non-primitive element types.
   * @returns A new Slice<T>.
   */
  function makeSlice<T>(
      len: number,
      cap?: number,
      zeroCtor?: () => T
  ): Slice<T>;

  /**
   * Returns the length of a slice or string, analogous to Go’s `len(x)`.
   * Aliases to `.length` for arrays or proxies.
   * @param x The slice or string.
   * @returns The length.
   */
  function len(x: Slice<unknown> | string): number;

  /**
   * Returns the capacity of a slice, analogous to Go’s `cap(x)`.
   * @param x The slice.
   * @returns The capacity.
   */
  function cap<T>(x: Slice<T>): number;

  /**
   * Creates a new slice from an existing slice, analogous to Go’s
   * `s = s[lo:hi]` (2-index form) or `s = s[lo:hi:max]` (3-index form).
   * @param src The source slice.
   * @param lo The low bound (inclusive).
   * @param hi The high bound (exclusive).
   * @param max Optional. The new capacity relative to the start of the source slice's
   *            backing array (for 3-index form). `newCap = max - lo`.
   * @returns A new Slice<T> viewing a portion of the source's backing array.
   */
  function goSlice<T>(
      src: Slice<T>,
      lo: number,
      hi: number,
      max?: number
  ): Slice<T>;

  /**
   * Appends elements to a slice, analogous to Go’s `append(dst, ...src)`.
   * Handles capacity and potential reallocation.
   * @param dst The destination slice.
   * @param srcElements Elements or other slices/arrays to append.
   * @returns The potentially new Slice<T> (if reallocation occurred or length changed).
   */
  function append<T>(
      dst: Slice<T>,
      ...srcElements: (T | T[] | Slice<T>)[]
  ): Slice<T>;

  /**
   * Copies elements from a source slice to a destination slice,
   * analogous to Go’s `copy(dst, src)`.
   * @param dst The destination slice.
   * @param src The source slice.
   * @returns The number of elements copied (the minimum of `len(dst)` and `len(src)`).
   */
  function copy<T>(dst: Slice<T>, src: Slice<T>): number;
}
```

**4.1. Conversion Rules Implemented by Helpers**

*   **Simplicity Preference:** Helper functions (`makeSlice`, `goSlice`, `append`) will return a plain `T[]` if the resulting slice's properties (`offset`, `len`, `cap`) perfectly align with a "simple view" of its backing array (offset 0, `len === cap === backing.length`). Otherwise, a `SliceProxy<T>` is returned, with its `__meta__` property correctly configured.
*   **`append` Reallocation:**
    *   `append` extends the slice in-place if the current `cap()` is sufficient for the new elements. The `len` is updated.
    *   If `cap()` is insufficient, a *new* backing array is allocated (typically with doubled capacity or as needed). Elements are copied from the old backing to the new one.
    *   Crucially, if a new backing array is allocated, any other existing slices that previously shared the *old* backing array continue to reference it, unaffected by the `append` operation on the specific `dst` slice. This mirrors Go's behavior.
    *   The `append` function always returns the (potentially new) slice reference, which must be reassigned (e.g., `s = $.append(s, ...)`).
*   **`goSlice` Optimization:** If `goSlice` is called on a simple `T[]` with `lo === 0`, `hi === originalArray.length`, and `max` is omitted (or `max === originalArray.length`), the function will return the *same `T[]` instance* to avoid unnecessary proxy creation.

**5. Compiler Translation Strategy (Go → TypeScript Transpiler)**

The transpiler will perform syntactic rewrites. It will not emit `Proxy` instances directly; these are created dynamically within the helper functions.

*   **a) Type Lowering:**
    *   Go `[]T` ➜ TypeScript `Slice<T>` (imported from the `builtin` module).
    *   Go `[N]T` (fixed-size array) ➜ TypeScript `T[]` (plain JavaScript array, with length `N`).
*   **b) Literals:**
    *   Go: `[]int{1, 2, 3}` ➜ TS: `[1, 2, 3]` (A plain `number[]`, assignable to `Slice<number>`).
*   **c) Standard Slice Operations:**
    *   Go: `s := make([]int, 0, 4)` ➜ TS: `let s: Slice<number> = $.makeSlice<number>(0, 4);`
    *   Go: `s = append(s, v)` ➜ TS: `s = $.append(s, v);`
    *   Go: `l := len(s)` ➜ TS: `const l = $.len(s);` (or `s.length` if type is narrowed)
    *   Go: `c := cap(s)` ➜ TS: `const c = $.cap(s);`
    *   Go: `n := copy(dst, src)` ➜ TS: `const n = $.copy(dst, src);`
*   **d) Element Access:**
    *   Go: `x = s[i]` ➜ TS: `x = s[i];`
    *   Go: `s[i] = y` ➜ TS: `s[i] = y;`
    *   Bounds checking:
        *   If `s` is a `SliceProxy<T>`, the proxy's `get`/`set` traps provide Go-style bounds checking.
        *   If `s` is a plain `T[]` (simple view or result of Go fixed-size array), indexing relies on JavaScript's behavior (returns `undefined` for out-of-bounds read, extends array for out-of-bounds write if not sparse). The transpiler should ensure that for code translated from Go's fixed-size arrays, indices are statically known to be in range. For `Slice<T>` that happens to be `T[]`, runtime behavior differs from Go's panic unless explicitly handled by proxy or wrapper functions.
*   **e) Three-Index Slicing:**
    *   Go: `t := s[lo:hi:max]` ➜ TS: `let t = $.goSlice(s, lo, hi, max);`
*   **f) Iteration (Range Loops):**
    *   Go: `for i, v := range s` ➜ TS: `for (const [i, v] of $.iterable(s).entries())` or similar, leveraging `Symbol.iterator` (the proxy must supply `Symbol.iterator` for `for...of` directly, or a helper can adapt it). A simple `for (const v of s)` would also work if only values are needed. For index and value, `s.entries()` (if available on proxy) or a custom iterator from helpers. A common approach is to ensure `SliceProxy` implements `[Symbol.iterator]()` yielding `T` and helper functions provide `entries(Slice<T>)` yielding `[number, T]`.
    *   To ensure correct iteration over the *logical view* of the slice, the `SliceProxy` will implement `Symbol.iterator`. Plain arrays iterate naturally.

**6. Zero Value Handling**

`$.makeSlice(len, cap, zeroCtor)` must initialize the `backing` array elements from index `0` to `cap - 1`.
*   **Primitive Types (`number`, `boolean`, `string`, `bigint`):** The backing array elements can be left as JavaScript's `undefined`. When accessed via a `SliceProxy<T>`, the `get` trap will convert `undefined` to the corresponding Go zero value (e.g., `0` for `number`, `false` for `boolean`, `""` for `string`) lazily upon read if needed.
*   **Non-Primitive Types (e.g., objects/structs):**
    *   If the transpiler can statically determine a zero-value constructor for `T` (e.g., for a struct type like `{ field: 0 }`), it will pass this `zeroCtor` to `$.makeSlice`. `$.makeSlice` will then populate the backing array up to `cap` with instances created by `zeroCtor()`.
    *   If no `zeroCtor` is provided, elements will be `undefined`. User code must then assign or append values before reading them, mirroring Go's behavior where uninitialized struct fields within a slice hold their respective zero values. Accessing an `undefined` non-primitive element via proxy might result in an error or a default empty object, depending on desired strictness.

**7. Proxy Behaviour – Detailed Notes (`SliceProxy<T>` Handler)**

The `Proxy` handler for `SliceProxy<T>` implements the following:

*   **`get(target, property, receiver)` trap:**
    *   If `property` is a numeric string:
        *   Convert `property` to `index = Number(property)`.
        *   Check if `index >= 0 && index < target.__meta__.len`.
        *   If in bounds: return `target.__meta__.backing[target.__meta__.offset + index]` (with potential lazy zero-value conversion for primitives if element is `undefined`).
        *   If out of bounds: throw a runtime error ("panic: runtime error: index out of range").
    *   If `property` is `"length"`: return `target.__meta__.len`.
    *   If `property` is `"__meta__"`: return `target.__meta__`.
    *   If `property` is one of the recognized array helper method names (e.g., `map`, `filter`, `reduce`, `forEach`, `slice`, `Symbol.iterator`):
        *   Return a function that, when called, applies the corresponding JavaScript array method to a *materialized temporary array* representing the current slice view: `target.__meta__.backing.slice(target.__meta__.offset, target.__meta__.offset + target.__meta__.len)`.
        *   The `this` context for these helper methods should be the proxy itself.
    *   Otherwise: `Reflect.get(target, property, receiver)`.

*   **`set(target, property, value, receiver)` trap:**
    *   If `property` is a numeric string:
        *   Convert `property` to `index = Number(property)`.
        *   Check if `index >= 0 && index < target.__meta__.len`.
        *   If in bounds: `target.__meta__.backing[target.__meta__.offset + index] = value; return true;`.
        *   **Design Choice for `s[len] = x`:** If `index === target.__meta__.len` AND `target.__meta__.len < target.__meta__.cap`:
            *   This specific case will effectively perform a single-element append. The element `value` is assigned to `target.__meta__.backing[target.__meta__.offset + index]`, and `target.__meta__.len` is incremented. This behavior is chosen for convenience, emulating the *result* of an append that fits within capacity. `return true;`.
            *   *(Alternative stricter Go behavior: `s[len] = x` would always be an out-of-bounds error. The chosen design makes assignment at `len` a growth operation if capacity permits.)*
        *   If out of bounds (and not the special `len < cap` case): throw a runtime error ("panic: runtime error: index out of range").
    *   If `property` is `"length"` or `"__meta__"` (or other `readonly` properties): `return false;` (assignment fails, or throw error for stricter behavior).
    *   Otherwise: `Reflect.set(target, property, value, receiver)`.

*   **Other traps (e.g., `has`, `ownKeys`):** Can be implemented as needed to fully emulate array-like behavior for operations like `in` operator or `Object.keys()`. `ownKeys` should typically report numeric indices from `0` to `len-1`, plus `length` and other defined properties.

**8. Goals**

*   **No Mutation of `Array.prototype`:** The global `Array.prototype` will remain untouched.
*   **Opaque Transitions:** The transition between a `T[]` representation and a `SliceProxy<T>` representation for a `Slice<T>` variable will be transparent to user code. The type `Slice<T>` abstracts this away.
*   **Minimized Overhead:** For "simple view" slices, operations will be close to raw JavaScript array performance. Proxies are only introduced when Go's more complex semantics (offset, distinct len/cap) are required.
*   **Tree-Shakeable Helpers:** All helper functions (`$.makeSlice`, `$.append`, etc.) will be exported from ES modules, allowing unused functions to be eliminated by modern bundlers if a program does not utilize them.
