**I. High-Level Breakdown**

*   **Go Semantics to Reproduce:**
    *   A slice is a descriptor for a contiguous segment of an underlying array, defined by a pointer to the array, a length, and a capacity.
    *   `make([]T, len, cap)`: Creates a new slice, allocating a new underlying array. The array elements up to `len` are initialized to their zero values.
    *   `s[i]`: Accesses an element. Bounds-checked (panics if out of range).
    *   `s[low:high]`: Creates a new slice sharing the same underlying array. Length is `high-low`, capacity is `cap(s)-low`.
    *   `s[low:high:max]`: Creates a new slice sharing the underlying array. Length is `high-low`, capacity is `max-low`. `max` is an index relative to the start of `s`.
    *   `append(s, elems...)`: Appends elements to `s`. If `s` has enough capacity, elements are added in-place. Otherwise, a new, larger underlying array is allocated, existing elements are copied, and then new elements are added. *Always returns a (potentially new) slice header.*
    *   `len(s)`: Returns the length of the slice.
    *   `cap(s)`: Returns the capacity of the slice.
    *   `copy(dst, src)`: Copies elements from `src` to `dst`, returns the number of elements copied.

*   **TypeScript Representation:**
    *   A class `GoSlice<T>` encapsulates the slice header:
        *   `private backing: T[]`: The underlying JavaScript array.
        *   `private offset: number`: The start index of this slice's view within the `backing` array.
        *   `private len: number`: The number of elements visible through this slice.
        *   `private cap: number`: The maximum number of elements that can be held in the `backing` array starting from `offset`, without reallocation.
    *   Public API on `GoSlice<T>`:
        *   `static make<T>(length: number, capacity?: number, zeroValueProvider?: () => T): GoSlice<T>`: Factory method.
        *   `static fromArray<T>(arr: T[]): GoSlice<T>`: Creates a slice from a JS array (copies data).
        *   `get length(): number`, `get capacity(): number`: Getters.
        *   `get(index: number): T`, `set(index: number, value: T): void`: Bounds-checked element access.
        *   `slice(low?: number, high?: number, maxCapacityIndex?: number): GoSlice<T>`: Corresponds to `s[low:high:maxCapacityIndex]`.
        *   `append(...elements: T[]): GoSlice<T>`: Appends elements, returns a new `GoSlice` instance.
        *   `toArray(): T[]`: Converts the slice's view to a new JavaScript array.
        *   `[Symbol.iterator](): IterableIterator<T>`: For `for...of` loops.
        *   Ergonomic array-like methods: `map()`, `filter()`, `reduce()`, `forEach()` operating on the slice's view.
    *   Builtin-style helper functions (e.g., in a `$.ts` or `builtin.ts` module):
        *   `type NilableSlice<T> = GoSlice<T> | null;`
        *   `const nilSlice = null;`
        *   `makeSlice<T>(...)`, `goLen(...)`, `goCap(...)`, `goAppend(...)`, `goSliceOp(...)`, `goCopy(...)`. These helpers work with `NilableSlice<T>` and plain JS arrays (for Go arrays).

*   **Developer UX Considerations:**
    *   Direct `s[i]` syntax for `GoSlice` instances is achieved via an optional `proxySlice(s)` helper, which wraps the `GoSlice` in a Proxy. This adds a small runtime overhead but offers familiar array syntax.
    *   The `GoSlice` class includes common methods like `map`, `filter`, `reduce` that operate on the current view of the slice, typically returning new JavaScript arrays (as is standard for these methods) or reduced values.
    *   The API aims for Go-like naming and behavior for core operations.

*   **Performance & Safety:**
    *   The backing store is a plain JavaScript `Array<T>`.
    *   Capacity is managed explicitly. `Array(capacity)` pre-allocates space, with elements being `undefined` unless a `zeroValueProvider` is used during `make`.
    *   All Go-idiomatic access (`get`, `set`, `slice`) is bounds-checked and throws `Error` (mimicking Go panics) with Go-like messages.
    *   `append` has amortized O(1) performance, becoming O(n) during reallocations. Growth strategy aims to mimic Go (e.g., doubling for smaller slices).

*   **Key Trade-offs & Notes:**
    *   **Zero Values:** Go's type-specific zero values (0, `false`, `""`, `nil`) are perfectly emulated when `makeSlice` is called by compiler-generated code, which can provide the correct zero value for `T`. If `GoSlice.make` is called manually in TS without a `zeroValueProvider`, `undefined` will be the default for non-primitive types.
    *   **Immutability of Slice Headers:** Operations like `slice` and `append` *always* return new `GoSlice` instances, even if the underlying `backing` array is unchanged. This matches Go's value semantics for slice headers. Element modifications via `set()` mutate the shared `backing` array.

---

**II. The Code**

```typescript
// goslice.ts (or could be part of builtin.ts)

// Helper for append growth calculation
function calculateGrowth(oldCap: number, minCap: number): number {
  if (minCap <= oldCap) {
    return oldCap;
  }
  if (oldCap === 0) {
    // If starting from a nil or empty slice, ensure newCap is at least minCap.
    // For very small minCap (e.g., 1), might want a slightly larger initial allocation.
    // Go's runtime has specific small-size allocations. Defaulting to minCap is simplest here.
     return minCap > 4 ? minCap : 4; // Ensure a minimum starting capacity
  }
  
  let newCap = oldCap;
  // Go's growth: if cap < 1024, double it. Else, grow by 25%.
  // More precisely, for Go 1.18+: threshold is 256. If oldCap < 256, newCap = oldCap * 2.
  // Else, newCap = oldCap; loop: newCap += (newCap + 3*256) / 4 until newCap >= minCap.
  // Simplified for this example:
  if (oldCap < 1024) {
      newCap = oldCap * 2;
  } else {
      newCap = Math.floor(oldCap * 1.25);
  }

  if (newCap < minCap) {
    newCap = minCap;
  }
  return newCap;
}

export class GoSlice<T> {
  private backing: T[];
  private offset: number; // Start index in backing array
  private len: number;    // Number of elements in this slice view
  private cap: number;    // Capacity of this slice view (from offset to end of usable backing)

  // Private constructor, use static factory methods
  private constructor(backing: T[], offset: number, length: number, capacity: number) {
    this.backing = backing;
    this.offset = offset;
    this.len = length;
    this.cap = capacity;
  }

  /**
   * Creates a new Go slice with the specified length and capacity.
   * @param length The length of the new slice.
   * @param capacity Optional capacity. If not provided, capacity equals length.
   * @param zeroValueProvider Optional function to provide zero values for type T.
   *                          If not provided, elements will be undefined or a default numeric zero.
   */
  static make<T>(length: number, capacity?: number, zeroValueProvider?: () => T): GoSlice<T> {
    if (length < 0) {
      throw new Error(`runtime error: makeslice: len out of range: ${length}`);
    }
    const capResolved = capacity === undefined ? length : capacity;
    if (capResolved < length) {
      throw new Error(`runtime error: makeslice: cap out of range: ${capResolved} < ${length}`);
    }

    const backing = new Array<T>(capResolved);
    if (zeroValueProvider) {
      for (let i = 0; i < length; i++) { // Only initialize up to length
        backing[i] = zeroValueProvider();
      }
    }
    // Note: Without zeroValueProvider, elements are 'undefined'.
    // The Go compiler would ensure zeroValueProvider is supplied for transpiled code.
    return new GoSlice(backing, 0, length, capResolved);
  }

  /**
   * Creates a GoSlice from a JavaScript array. The new slice will have its own backing array
   * containing a copy of the elements from the input array.
   * @param arr The JavaScript array to convert.
   * @param depth Recursion depth for multi-dimensional arrays (default 1).
   */
  static fromArray<T>(arr: T[] | null | undefined, depth: number = 1): GoSlice<T> | null {
    if (arr == null) return null;

    const newBacking = new Array<T>(arr.length);
    for (let i = 0; i < arr.length; i++) {
        const item = arr[i];
        if (depth > 1 && Array.isArray(item)) {
            newBacking[i] = GoSlice.fromArray(item as any[], depth - 1) as any;
        } else {
            newBacking[i] = item;
        }
    }
    return new GoSlice(newBacking, 0, newBacking.length, newBacking.length);
  }


  /** Gets the length of the slice. */
  public get length(): number {
    return this.len;
  }

  /** Gets the capacity of the slice. */
  public get capacity(): number {
    return this.cap;
  }

  /**
   * Gets the element at the specified index.
   * @param index The index of the element to retrieve.
   * @throws Error if index is out of bounds.
   */
  public get(index: number): T {
    if (index < 0 || index >= this.len) {
      throw new Error(`runtime error: index out of range [${index}] with length ${this.len}`);
    }
    return this.backing[this.offset + index];
  }

  /**
   * Sets the element at the specified index.
   * @param index The index of the element to set.
   * @param value The new value for the element.
   * @throws Error if index is out of bounds.
   */
  public set(index: number, value: T): void {
    if (index < 0 || index >= this.len) {
      throw new Error(`runtime error: index out of range [${index}] with length ${this.len}`);
    }
    this.backing[this.offset + index] = value;
  }

  /**
   * Creates a new slice from this slice.
   * Corresponds to Go's s[low:high:maxCapIndex] operation.
   * @param low The starting index of the new slice, inclusive. Defaults to 0.
   * @param high The ending index of the new slice, exclusive. Defaults to current length.
   * @param maxCapIndex Optional. The index (relative to current slice's view) that defines the new slice's capacity.
   *                    The new capacity will be maxCapIndex - low.
   * @throws Error if indices are out of bounds.
   */
  public slice(low?: number, high?: number, maxCapIndex?: number): GoSlice<T> {
    const l = low ?? 0;
    const h = high ?? this.len;

    if (l < 0 || l > this.len) {
      throw new Error(`runtime error: slice bounds out of range [${l}:${h}] with length ${this.len}`);
    }
    if (h < l || h > this.len) {
      throw new Error(`runtime error: slice bounds out of range [${l}:${h}] with length ${this.len}`);
    }

    const newOffset = this.offset + l;
    const newLength = h - l;
    let newCapacity: number;

    if (maxCapIndex !== undefined) {
      // maxCapIndex is 'c' in Go's s[a:b:c]. It's an index into the current slice's view, up to its capacity.
      // Constraints: 0 <= low <= high <= maxCapIndex <= this.capacity()
      if (maxCapIndex < h || maxCapIndex > this.cap) {
        throw new Error(`runtime error: slice bounds out of range [${l}:${h}:${maxCapIndex}] with capacity ${this.cap}`);
      }
      newCapacity = maxCapIndex - l;
    } else {
      newCapacity = this.cap - l;
    }

    return new GoSlice<T>(this.backing, newOffset, newLength, newCapacity);
  }

  /**
   * Appends elements to the slice, returning a new slice.
   * If the current slice has enough capacity, the append happens in-place (but still returns a new slice header).
   * Otherwise, a new backing array is allocated.
   * @param elements The elements to append.
   * @returns A new GoSlice instance.
   */
  public append(...elements: T[]): GoSlice<T> {
    if (elements.length === 0) {
      // Return a new slice header pointing to the same view.
      return new GoSlice(this.backing, this.offset, this.len, this.cap);
    }

    const newRequiredLen = this.len + elements.length;
    if (newRequiredLen <= this.cap) {
      // Can append in-place within the current view's capacity.
      // Modify the shared backing array.
      for (let i = 0; i < elements.length; i++) {
        this.backing[this.offset + this.len + i] = elements[i];
      }
      // Return a new slice header with updated length.
      return new GoSlice<T>(this.backing, this.offset, newRequiredLen, this.cap);
    } else {
      // Need to reallocate a new backing array.
      const newCap = calculateGrowth(this.cap, newRequiredLen);
      const newBacking = new Array<T>(newCap);

      // Copy existing elements from the current slice's view.
      for (let i = 0; i < this.len; i++) {
        newBacking[i] = this.backing[this.offset + i];
      }
      // Add new elements.
      for (let i = 0; i < elements.length; i++) {
        newBacking[this.len + i] = elements[i];
      }
      // Return a new slice header for the new backing array.
      return new GoSlice<T>(newBacking, 0, newRequiredLen, newCap);
    }
  }

  /**
   * Converts the slice's view into a new JavaScript array.
   * @returns A new JavaScript array containing the elements of the slice.
   */
  public toArray(): T[] {
    const result = new Array<T>(this.len);
    for (let i = 0; i < this.len; i++) {
      result[i] = this.backing[this.offset + i];
    }
    return result;
  }

  /**
   * Makes the GoSlice iterable using `for...of`.
   */
  public *[Symbol.iterator](): IterableIterator<T> {
    for (let i = 0; i < this.len; i++) {
      yield this.backing[this.offset + i];
    }
  }

  // --- Ergonomic Array-like Methods ---

  /**
   * Creates a new array populated with the results of calling a provided function
   * on every element in the calling GoSlice.
   */
  public map<U>(callbackfn: (value: T, index: number, slice: GoSlice<T>) => U): U[] {
    const result = new Array<U>(this.len);
    for (let i = 0; i < this.len; i++) {
        result[i] = callbackfn(this.backing[this.offset + i], i, this);
    }
    return result;
  }

  /**
   * Creates a new array with all elements that pass the test implemented by the provided function.
   */
  public filter(predicate: (value: T, index: number, slice: GoSlice<T>) => boolean): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.len; i++) {
        const value = this.backing[this.offset + i];
        if (predicate(value, i, this)) {
            result.push(value);
        }
    }
    return result;
  }
  
  /**
   * Executes a user-supplied "reducer" callback function on each element of the slice,
   * in order, passing in the return value from the calculation on the preceding element.
   */
  public reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, slice: GoSlice<T>) => U, initialValue: U): U;
  public reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, slice: GoSlice<T>) => T): T; // Overload for when initialValue is not provided and T is used as U
  public reduce<U>(callbackfn: (previousValue: U | T, currentValue: T, currentIndex: number, slice: GoSlice<T>) => U | T, initialValue?: U | T): U | T {
    let accumulator: U | T;
    let startIndex = 0;

    if (arguments.length >= 2) { // initialValue was provided
        accumulator = initialValue!;
    } else { // initialValue was not provided
        if (this.len === 0) {
            throw new TypeError("Reduce of empty slice with no initial value");
        }
        accumulator = this.backing[this.offset] as any; // First element as initial value
        startIndex = 1;
    }

    for (let i = startIndex; i < this.len; i++) {
        accumulator = callbackfn(accumulator, this.backing[this.offset + i], i, this);
    }
    return accumulator;
  }

  /**
   * Executes a provided function once for each slice element.
   */
  public forEach(callbackfn: (value: T, index: number, slice: GoSlice<T>) => void): void {
    for (let i = 0; i < this.len; i++) {
        callbackfn(this.backing[this.offset + i], i, this);
    }
  }
}

/**
 * Optional helper to wrap a GoSlice with a Proxy to allow direct bracket notation
 * for get/set operations (e.g., `proxiedSlice[0]`, `proxiedSlice[0] = value`).
 * This incurs a small runtime overhead due to the Proxy.
 */
export function proxySlice<T>(s: GoSlice<T>): GoSlice<T> & { [i: number]: T } {
  return new Proxy(s as any, { // `as any` to satisfy Proxy target constraints for adding index signature
    get(target: GoSlice<T>, prop: string | symbol) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        return target.get(Number(prop));
      }
      // Delegate other properties (like length, capacity, methods) to the original target
      return (target as any)[prop];
    },
    set(target: GoSlice<T>, prop: string | symbol, value: T) {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        target.set(Number(prop), value);
        return true; // Indicates success
      }
      // Allow setting other properties if necessary, though generally not for slice data
      (target as any)[prop] = value;
      return true;
    },
  }) as GoSlice<T> & { [i: number]: T };
}

// --- Builtin-style Helper Functions (for compiler output) ---

/** Represents a Go slice, which can be a GoSlice instance or null (for nil slices). */
export type NilableSlice<T> = GoSlice<T> | null;

/** Represents the Go nil slice value. */
export const nilSlice = null;

/** Corresponds to Go's `make([]T, length, capacity?)`. */
export function makeSlice<T>(length: number, capacity?: number, zeroValueProvider?: () => T): NilableSlice<T> {
  // A length of 0 for make is valid and should produce a non-null, empty slice.
  return GoSlice.make(length, capacity, zeroValueProvider);
}

/** Corresponds to Go's `len()` builtin. Handles GoSlices, JS arrays, strings, and Maps. */
export function goLen<T = unknown, K = unknown, V = unknown>(
  collection: NilableSlice<T> | T[] | string | Map<K,V> | null | undefined
): number {
  if (collection == null) return 0; // Handles null and undefined
  if (collection instanceof GoSlice) return collection.length;
  if (typeof collection === 'string' || Array.isArray(collection)) return collection.length;
  if (collection instanceof Map) return collection.size;
  // Should not happen with type-safe transpiled code for supported types
  throw new Error("runtime error: len: invalid argument"); 
}

/** Corresponds to Go's `cap()` builtin. Handles GoSlices and JS arrays (Go arrays). */
export function goCap<T>(s: NilableSlice<T> | T[] | null | undefined ): number {
  if (s == null) return 0;
  if (s instanceof GoSlice) return s.capacity;
  if (Array.isArray(s)) return s.length; // Go array's capacity is its length
  throw new Error("runtime error: cap: invalid argument");
}

/** Corresponds to Go's `append(slice, elements...)`. */
export function goAppend<T>(s: NilableSlice<T>, ...elements: T[]): NilableSlice<T> {
  if (s === null) {
    if (elements.length === 0) return null; // Appending nothing to nil slice is still nil slice
    // Appending to a nil slice: create a new slice.
    // The compiler should provide the zeroValueProvider if T has a non-undefined zero.
    return GoSlice.make<T>(elements.length, undefined, /* zeroValueProvider placeholder */ undefined)._initializeFromElements(elements);
  }
  return s.append(...elements);
}
// Add a helper to GoSlice for the above append-to-nil case to avoid exporting constructor
declare module "./goslice" { // Or wherever GoSlice is defined
    interface GoSlice<T> {
        _initializeFromElements(elements: T[]): GoSlice<T>;
    }
}
GoSlice.prototype._initializeFromElements = function<T>(this: GoSlice<T>, elements: T[]): GoSlice<T> {
    // This method assumes `this` is a newly created slice from `make` with sufficient capacity.
    for(let i=0; i < elements.length; i++) {
        this.backing[i] = elements[i]; // offset is 0 for newly made slice
    }
    // this.len is already set by make
    return this;
};


/** Corresponds to Go's slice operation `s[low:high:maxCapIdx]`. Handles GoSlices and JS arrays. */
export function goSliceOp<T>(
  s: NilableSlice<T> | T[] | null | undefined, 
  low?: number, high?: number, 
  maxCapIndex?: number
): NilableSlice<T> {
  if (s == null) {
    // Slicing a nil slice: "For a nil or empty slice, the result is a nil or empty slice."
    // To be strictly Go-like, if low/high/max are all zero/default for nil slice, should return nil.
    // If bounds are non-zero, it would panic.
    // This implementation will panic if bounds are invalid.
    // If low/high/max are such that they'd result in an empty slice (e.g. 0,0) on a conceptual empty slice,
    // returning an empty non-nil slice is also acceptable.
    // Let's assume `makeSlice(0,0)` for this case if bounds imply empty.
    const l = low ?? 0;
    const h = high ?? 0;
    if (l === 0 && h === 0 && maxCapIndex === undefined) return null; // s[:] on nil slice is nil slice
    // Otherwise, attempting to slice a nil slice with actual bounds would panic in Go.
    // Throwing here is consistent if bounds are non-trivial for a nil slice.
    // The GoSlice.slice method will throw if called on effectively zero-len/cap slice with out-of-range bounds.
    // A simple way: pretend it's an empty slice for bounds checking, but this is tricky.
    // The `slice` method on `GoSlice` handles this better by checking against current len/cap.
    // Let's defer to `GoSlice.make(0).slice(...)` which will panic correctly or return empty.
    return GoSlice.make<T>(0,0).slice(low,high,maxCapIndex);
  }
  if (s instanceof GoSlice) {
    return s.slice(low, high, maxCapIndex);
  }
  // If s is T[] (representing a Go array), create a temporary GoSlice view to perform Go-style slicing.
  // The backing array `s` is used directly for this temporary view.
  const tempSliceView = new (GoSlice as any)(s, 0, s.length, s.length); // Internal constructor access for this helper
  return tempSliceView.slice(low, high, maxCapIndex);
}

/** Corresponds to Go's `copy(dst, src)` builtin. */
export function goCopy<T>(dst: NilableSlice<T> | T[], src: NilableSlice<T> | T[] | string): number {
  if (dst == null || src == null ) { // Check for nullish dst or src
    return 0;
  }

  let dstLen: number;
  let dstSet: (idx: number, val: T) => void;
  let dstIsGoSlice = dst instanceof GoSlice;

  if (dstIsGoSlice) {
    dstLen = (dst as GoSlice<T>).length;
    dstSet = (idx, val) => (dst as GoSlice<T>).set(idx, val);
  } else if (Array.isArray(dst)) {
    dstLen = dst.length;
    dstSet = (idx, val) => { if (idx < dst.length) dst[idx] = val; };
  } else {
    return 0; // Invalid destination type
  }

  let srcLen: number;
  let srcGet: (idx: number) => T; // Assuming T for string elements will be number (rune/byte)

  if (src instanceof GoSlice) {
    srcLen = src.length;
    srcGet = (idx) => src.get(idx);
  } else if (Array.isArray(src)) {
    srcLen = src.length;
    // Ensure T matches if src is T[] and dst is GoSlice<T> or T[]
    srcGet = (idx) => src[idx] as T; 
  } else if (typeof src === 'string') {
    srcLen = src.length;
    // This assumes T is number for byte/rune when copying from string
    srcGet = (idx) => src.codePointAt(idx)! as any; // Use codePointAt for runes
  } else {
    return 0; // Invalid source type
  }
  
  const numToCopy = Math.min(dstLen, srcLen);
  for (let i = 0; i < numToCopy; i++) {
    dstSet(i, srcGet(i));
  }
  return numToCopy;
}
```

---

**III. Usage Examples (Conceptual, assuming transpiled from Go)**

```typescript
// Go: package main
//     func main() {
//       s0 := make([]int, 3, 5)
//       s0[0] = 10; s0[1] = 20;
//       s1 := s0[1:3]
//       s2 := append(s1, 40, 50)
//       s3 := append(s2, 60, 70, 80)
//       for i, v := range s3 { println(i, v) }
//       var s4 []string; println(len(s4), cap(s4))
//       s5 := []int{1,2,3}
//       p := proxySlice(s5)
//       p[0] = 100
//     }

// Transpiled TypeScript (illustrative):
import { makeSlice, goLen, goCap, goAppend, goSliceOp, nilSlice, proxySlice, GoSlice } from "./goslice"; // or "./builtin"

export function main(): void {
  // s0 := make([]int, 3, 5)
  const s0 = makeSlice<number>(3, 5, () => 0); // Compiler provides zero value for int
  
  // s0[0] = 10; s0[1] = 20;
  s0!.set(0, 10); 
  s0!.set(1, 20);

  // s1 := s0[1:3]
  let s1 = goSliceOp(s0, 1, 3);
  console.log(`s1: len=${goLen(s1)}, cap=${goCap(s1)}, array=${s1?.toArray()}`); // [20, 0]

  // s2 := append(s1, 40, 50)
  let s2 = goAppend(s1, 40, 50);
  console.log(`s2: len=${goLen(s2)}, cap=${goCap(s2)}, array=${s2?.toArray()}`); // [20, 0, 40, 50] (cap depends on s0's cap)
  
  // s3 := append(s2, 60, 70, 80)
  let s3 = goAppend(s2, 60, 70, 80);
  console.log(`s3: len=${goLen(s3)}, cap=${goCap(s3)}, array=${s3?.toArray()}`); // [20,0,40,50,60,70,80] (likely reallocated)

  // for i, v := range s3
  if (s3) { // Check for non-nil slice
    for (let i = 0; i < s3.length; i++) {
      const v = s3.get(i);
      console.log(i, v);
    }
  }
  // Or using iterator:
  // if (s3) { for (const v of s3) { console.log(v); } }


  // var s4 []string; println(len(s4), cap(s4))
  let s4: NilableSlice<string> = nilSlice;
  console.log(goLen(s4), goCap(s4)); // 0 0

  // s5 := []int{1,2,3}
  let s5 = GoSlice.fromArray([1,2,3].map(() => 0).map((_,i) => [1,2,3][i])); // Or compiler generates direct backing array with zeros
  // More accurately from compiler:
  const s5_backing = [1,2,3];
  s5 = new (GoSlice as any)(s5_backing, 0, 3, 3); // Illustrative, compiler ensures correct construction

  // Proxy example
  if (s5) {
    let p = proxySlice(s5);
    p[0] = 100;
    console.log(p.get(0)); // 100
    console.log(s5.get(0)); // 100 (shared backing)
  }
}
```