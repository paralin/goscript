────────────────────────────────────────
Design Document – Go-Slice Emulation in TypeScript
────────────────────────────────────────

1. Core Public Type
───────────────────
```ts
/** 1:1 with Go’s `[]T`  */
export type Slice<T> = T[] | SliceProxy<T>;
```
• When the view is “simple” (offset 0, len == cap == backing.length) we keep the plain `T[]`.
• Any divergence (sub-slice, manual capacity, append re-grow, etc.) is represented by the `SliceProxy<T>` described next.

2. Internal Representation
──────────────────────────
```ts
/** Hidden metadata that preserves Go semantics. */
interface GoSliceObject<T> {
  readonly backing: T[];   // shared backing array
  readonly offset: number; // starting index into backing
  readonly len:    number; // visible length
  readonly cap:    number; // visible capacity (offset+cap<=backing.length)
}

/** What user code actually sees whenever a proxy is necessary. */
export type SliceProxy<T> = {
  /** Normal indexed access – enforced bounds check */
  [k: number]: T;
  /** JS length mirrors Go’s len() (read-only) */
  readonly length: number;

  /** Standard array helpers available */
  map<U>(cb: (v: T, i: number) => U): U[];
  filter(cb: (v: T, i: number) => boolean): T[];
  reduce<U>(cb: (acc: U, v: T, i: number) => U, init: U): U;
  forEach(cb: (v: T, i: number) => void): void;
  [Symbol.iterator](): IterableIterator<T>;
  slice(start?: number, end?: number): T[];  // JS slice (returns *plain* array)

  /** Internal – used by helper functions, not visible in .d.ts shipped to users */
  readonly __meta__: GoSliceObject<T>;
};
```
Implementation note: `SliceProxy<T>` values are instances returned by `new Proxy(target, handler)`.
The `handler` delegates property reads/writes to the appropriate index within `backing`, performs Go-style bounds checking, exposes `length`, and lazily binds the handful of array helpers listed above.
No modifications to `Array.prototype` are involved.

3. Helper Runtime (`builtin.ts`)
────────────────────────────────
All helpers live in a reserved namespace (shown here as `$`).  Only their signatures and behavioural contracts are part of this document.

```ts
export namespace $ {
  /** Go’s make([]T, len, cap) */
  function makeSlice<T>(
      len: number,
      cap?: number,               // defaults to len
      zeroCtor?: () => T          // supplies element zero-value if non-primitive
  ): Slice<T>;

  /** Go’s len(x) – aliases to .length for arrays or proxies */
  function len(x: Slice<unknown>|string): number;

  /** Go’s cap(x) */
  function cap<T>(x: Slice<T>): number;

  /** The s = s[lo:hi] or s[lo:hi:max] transformation */
  function goSlice<T>(
      src : Slice<T>,
      lo  : number,
      hi  : number,
      max?: number                 // present only for 3-index form
  ): Slice<T>;

  /** Go’s append(dst, ...src)  – returns the *new* slice */
  function append<T>(
      dst : Slice<T>,
      ...src: (T | T[] | Slice<T>)[]
  ): Slice<T>;

  /** Go’s copy(dst, src) – returns #elements copied */
  function copy<T>(dst: Slice<T>, src: Slice<T>): number;
}
```

3.1  Conversion Rules Implemented by Helpers
--------------------------------------------
• If every semantic property of the result still matches “simple view”, the helpers **return a plain `T[]`**; otherwise they **return a `SliceProxy<T>`** whose `__meta__` captures the correct backing/offset/len/cap.
• `append` creates a *new* backing array only when the requested growth would exceed `cap()`.  Otherwise it extends in-place.  Whenever a new backing is allocated, **all slices that previously referenced the old array continue to point to it**, exactly like Go.
• `goSlice` on a simple `T[]` with `lo = 0`, `hi = dst.length`, `max` omitted simply **returns the same array instance**.

4. Compiler Translation Strategy
────────────────────────────────
The Go→TS transpiler performs purely syntactic rewrites, never emitting raw proxies by itself; proxies arise dynamically inside helpers.

a) Type lowering
   • Go `[]T` ➜ `Slice<T>` (imported from builtins).
   • Go `[N]T` ➜ plain `T[]`.

b) Literals
   • `[]int{1,2}` ➜ `[1,2]` (plain array, type `Slice<number>`).

c) make/append/slice/copy/len/cap
   Example:
     Go: `s = make([]int, 0, 4)`
     TS: `s = $.makeSlice<number>(0,4);`

   Example:
     Go: `s = append(s, v)`
     TS: `s = $.append(s, v);`   // note reassignment exactly like Go

d) Element access
   • `s[i]` ➜ `s[i]` (unchanged).
     Bounds checking is automatically provided when `s` is a `SliceProxy<T>`; plain arrays rely on JavaScript behaviour (no check) which is correct because compiler guarantees indices are in-range for that representation.

e) Three-index slice
   Go: `t = s[lo:hi:max]`
   TS: `t = $.goSlice(s, lo, hi, max);`

f) Iteration
   • Range loops are rewritten to `for (const [idx, val] of s.entries())` if `s` is known slice; the proxy supplies `Symbol.iterator` so both arrays and proxies iterate correctly.

5. Zero Value Handling
──────────────────────
`$.makeSlice` must allocate a backing array of length `cap`.
• For *primitive* element types (`number`, `boolean`, `string`, `bigint`) we rely on JavaScript’s `undefined`; reads through a proxy convert `undefined` to Go’s zero value lazily.
• For *non-primitive* `T` the compiler passes a `zeroCtor` factory when it can statically determine a zero value (e.g. structs become `{}`); otherwise user code must append/assign before reading, matching Go’s “contains zero value until first write” rule.

6. Proxy Behaviour – Detailed Notes
───────────────────────────────────
• Read access (`get`)
  – index within `[0,len)` ➜ `backing[offset+index]` (converted zero if `undefined`).
  – `"length"` ➜ `len`.
  – any recognised array helper name ➜ a wrapper that applies the helper to a *materialised* JS array view (`backing.slice(offset, offset+len)`).
• Write access (`set`)
  – index within `[0,len)` ➜ assign to `backing[offset+index]`.
  – index == `len` and `len < cap` ➜ grow in-place just like Go’s automatic re-allocation on append path. (In practice this path delegates to `$.append`).
• All other keys fall through to underlying helper wrappers.

7. Non-Goals & Guarantees
─────────────────────────
• No mutation of `Array.prototype`.
• All transitions between plain array and proxy are *opaque* to user code; a variable of type `Slice<T>` can be freely passed around.
• Minimise overhead: the hot code path (simple slices) stays a raw array; proxies are only constructed when required.
• All helpers are tree-shakable ES modules; unused slice support is stripped by bundlers for programs that never take non-trivial subslices.

────────────────────────────────────────
End of document
────────────────────────────────────────
