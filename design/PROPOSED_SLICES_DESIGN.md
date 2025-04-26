Below is a polished, self-contained TypeScript “slice” library that closely mirrors Go’s slice semantics—underlying array, slice header (pointer+len+cap), low:high[:max] slicing, make, append-with‐possible‐reallocation, bounds‐checking—and a brief outline of the key design decisions, trade-offs, and usage patterns.

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
I. High-Level Breakdown

    Go Semantics to Reproduce
    • Slice header = (data pointer, len, cap)
    • make([]T, len, cap) ⇒ new backing array, filled with zero/undefined
    • s[i]—bounds-checked indexing
    • s[low:high[:max]] ⇒ new header, same backing, len=high−low, cap=max−low or old.cap−low
    • append(s, elems…) ⇒ if len+elems ≤ cap, write in place; else allocate new backing of larger cap (≈2×), copy, then write; return new slice header

    TypeScript Representation
    • Class Slice<T> with private: data: T[], offset: number, len: number, cap: number
    • Public API:
    – static make<T>(len: number, cap?: number): Slice<T>
    – length, capacity getters
    – get(i), set(i, v) (both bounds-checked)
    – slice(low, high, max?)
    – append(...items)
    – toArray(), Symbol.iterator

    Developer UX Considerations
    – Direct arr[i] syntax is not natively overloadable; for maximum clarity and performance we expose get/set methods.
    – Optionally, a Proxy factory can wrap a Slice<T> to allow arr[i] and arr[i]=v at the cost of a small runtime penalty.
    – Familiar Go-style names and behaviors.

    Performance & Safety
    – Backing array = plain JS Array<T>, no Promise of contiguous memory but near‐equivalent.
    – Preallocate capacity via new Array(cap) so that array.length=cap; holes are undefined (TS default).
    – Bounds‐checking throws RangeError.
    – Amortized O(1) append, O(n) when growing backing.

    Testing & Pitfalls
    – Fully bounds‐checked, so no hidden off‐by‐one.
    – Uses max parameter to enforce Go’s full slice expression.
    – Default “zero value” = undefined (cannot emulate Go’s numeric zero generically).
    – Proxy index‐overload is optional/opt-in.

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
II. The Code

// slice.ts

export class Slice<T> {
  // Underlying array, full capacity
  private data: T[];
  // Offset within data
  private offset: number;
  // Visible length
  private len: number;
  // Capacity from offset
  private cap: number;

  private constructor(data: T[], offset: number, len: number, cap: number) {
    this.data = data;
    this.offset = offset;
    this.len = len;
    this.cap = cap;
  }

  // Create a new slice with given length and optional capacity
  static make<T>(length: number, capacity?: number): Slice<T> {
    if (length < 0) throw new RangeError("make: negative length");
    const cap = capacity === undefined ? length : capacity;
    if (cap < length) throw new RangeError("make: capacity < length");
    // Pre-allocate backing array; holes = undefined
    const arr = new Array<T>(cap);
    return new Slice(arr, 0, length, cap);
  }

  // Number of accessible elements
  get length(): number {
    return this.len;
  }

  // Maximum number of elements before reallocation
  get capacity(): number {
    return this.cap;
  }

  // Bounds-checked read
  get(index: number): T {
    if (index < 0 || index >= this.len) {
      throw new RangeError(`index ${index} out of range [0, ${this.len})`);
    }
    return this.data[this.offset + index];
  }

  // Bounds-checked write
  set(index: number, value: T): void {
    if (index < 0 || index >= this.len) {
      throw new RangeError(`index ${index} out of range [0, ${this.len})`);
    }
    this.data[this.offset + index] = value;
  }

  // low:high[:max] slicing
  slice(low: number = 0, high?: number, max?: number): Slice<T> {
    if (low < 0 || low > this.len) {
      throw new RangeError("slice: low out of range");
    }
    const h = high === undefined ? this.len : high;
    if (h < low || h > this.len) {
      throw new RangeError("slice: high out of range");
    }
    const newLen = h - low;

    let newCap: number;
    if (max !== undefined) {
      if (max < h || max > this.cap) {
        throw new RangeError("slice: max out of range");
      }
      newCap = max - low;
    } else {
      newCap = this.cap - low;
    }

    return new Slice(
      this.data,
      this.offset + low,
      newLen,
      newCap
    );
  }

  // Append items; returns a new slice header (which may share or reallocate)
  append(...items: T[]): Slice<T> {
    const totalNewLen = this.len + items.length;
    if (items.length === 0) {
      // No change
      return new Slice(this.data, this.offset, this.len, this.cap);
    }
    if (totalNewLen <= this.cap) {
      // In-place: write into backing
      for (let i = 0; i < items.length; i++) {
        this.data[this.offset + this.len + i] = items[i];
      }
      return new Slice(this.data, this.offset, totalNewLen, this.cap);
    }

    // Need to grow: newCap ≈ max(oldCap*2, totalNewLen)
    let newCap = Math.max(this.cap * 2, totalNewLen);
    if (newCap < 1) newCap = 1;
    const newData = new Array<T>(newCap);
    // Copy existing elements
    for (let i = 0; i < this.len; i++) {
      newData[i] = this.data[this.offset + i];
    }
    // Append new
    for (let i = 0; i < items.length; i++) {
      newData[this.len + i] = items[i];
    }
    return new Slice(newData, 0, totalNewLen, newCap);
  }

  // Convert to a plain TS array of length `len`
  toArray(): T[] {
    return this.data.slice(this.offset, this.offset + this.len);
  }

  // Make it iterable (for...of)
  *[Symbol.iterator](): IterableIterator<T> {
    for (let i = 0; i < this.len; i++) {
      yield this.data[this.offset + i];
    }
  }
}

// Optional helper to get Proxy-based indexing (arr[0], arr[0] = v)
export function proxySlice<T>(s: Slice<T>): Slice<T> & { [i: number]: T } {
  return new Proxy(s as any, {
    get(target, prop: string | symbol) {
      if (typeof prop === "string" && /^\d+$/.test(prop)) {
        return target.get(Number(prop));
      }
      // @ts-ignore
      return target[prop];
    },
    set(target, prop: string | symbol, value) {
      if (typeof prop === "string" && /^\d+$/.test(prop)) {
        target.set(Number(prop), value);
        return true;
      }
      // @ts-ignore
      target[prop] = value;
      return true;
    },
  });
}

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
III. Usage Examples

import { Slice, proxySlice } from "./slice";

// 1) make
const s0 = Slice.make<number>(3, 5);
// len=3, cap=5, contents=[undefined,undefined,undefined]
s0.set(0, 10); s0.set(1, 20); s0.set(2, 30);

// 2) basic indexing
console.log(s0.get(1)); // 20

// 3) slicing
const s1 = s0.slice(1, 3);  // length=2, capacity=4
console.log(s1.toArray()); // [20, 30]

// 4) append within cap
const s2 = s1.append(40, 50); 
console.log(s2.toArray()); // [20,30,40,50], cap still ≥4

// 5) append overflow ⇒ reallocate
const s3 = s2.append(60, 70, 80); 
console.log(s3.length, s3.capacity); 
console.log(s3.toArray()); // [20,30,40,50,60,70,80]

// 6) for-of iteration
for (const v of s3) {
  console.log(v);
}

// 7) Proxy‐based indexing (opt-in)
let p = proxySlice(Slice.make<string>(2,4));
p[0] = "hello";
p[1] = "world";
console.log(p[0], p[1]);  // ok!

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
IV. Trade-offs & Pitfalls

• Default values are undefined—cannot generically produce Go’s type-specific zeros.
• You must use get/set (or opt into the Proxy wrapper) rather than raw [] indexing.
• No built-in .map/.filter—you can always do slice.toArray().map(...).
• Runtime bounds-checking adds minimal overhead but prevents silent bugs.
• Append growth factor is 2× for amortized performance, matching Go’s typical strategy.
• Slicing with a max argument enforces “full slice expression” capacity limits.

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
This library gives you almost drop-in Go slice behavior in TypeScript—static typing on T, explicit capacity and length tracking, efficient append, safe slicing, and clear error reporting.