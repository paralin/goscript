import type { Slice, SliceProxy } from './slice.js'
import { isSliceProxy } from './slice.js'

/**
 * Implementation of Go's built-in println function
 * @param args Arguments to print
 */
export function println(...args: any[]): void {
  console.log(...args)
}

/**
 * Implementation of Go's built-in panic function
 * @param args Arguments passed to panic
 */
export function panic(...args: any[]): void {
  throw new Error(`panic: ${args.map((arg) => String(arg)).join(' ')}`)
}

// Bytes represents all valid []byte representations in TypeScript
// This includes Uint8Array (the preferred representation) and $.Slice<number> (which includes null)
export type Bytes = Uint8Array | Slice<number>

// int converts a value to a Go int type, handling proper signed integer conversion
// This ensures that values like 2147483648 (2^31) are properly handled according to Go semantics
export function int(value: number): number {
  // In Go, int is typically 64-bit on 64-bit systems, but for compatibility with JavaScript
  // we need to handle the conversion properly. The issue is that JavaScript's number type
  // can represent values larger than 32-bit signed integers, but when cast in certain contexts
  // they get interpreted as signed 32-bit integers.
  //
  // For Go's int type on 64-bit systems, we should preserve the full value
  // since JavaScript numbers can safely represent integers up to Number.MAX_SAFE_INTEGER
  //
  // For this we use Math.trunc.
  return Math.trunc(value)
}

// Duration multiplication helper for time package operations
// Handles expressions like time.Hour * 24
export function multiplyDuration(duration: any, multiplier: number): any {
  // Duration is now a number type alias, so just multiply directly
  if (typeof duration === 'number') {
    return duration * multiplier
  }

  throw new Error(`Cannot multiply duration of type ${typeof duration}`)
}

/**
 * Normalizes various byte representations into a `Uint8Array` for protobuf compatibility.
 *
 * @param {Uint8Array | number[] | null | undefined | { data: number[] } | { valueOf(): number[] }} bytes
 *   The input to normalize. Accepted types:
 *   - `Uint8Array`: Returned as-is.
 *   - `number[]`: Converted to a `Uint8Array`.
 *   - `null` or `undefined`: Returns an empty `Uint8Array`.
 *   - `{ data: number[] }`: An object with a `data` property (e.g., `$.Slice<number>`), where `data` is a `number[]`.
 *   - `{ valueOf(): number[] }`: An object with a `valueOf` method that returns a `number[]`.
 * @returns {Uint8Array} A normalized `Uint8Array` representation of the input.
 * @throws {Error} If the input type is unsupported or cannot be normalized.
 */
export function normalizeBytes(
  bytes:
    | Uint8Array
    | number[]
    | null
    | undefined
    | { data: number[] },
): Uint8Array {
  if (bytes === null || bytes === undefined) {
    return new Uint8Array(0)
  }

  if (bytes instanceof Uint8Array) {
    return bytes
  }

  // Handle $.Slice<number> (which has a .data property that's a number[])
  if (
    bytes &&
    typeof bytes === 'object' &&
    'data' in bytes &&
    Array.isArray(bytes.data)
  ) {
    return new Uint8Array(bytes.data)
  }

  // Handle plain number arrays
  if (Array.isArray(bytes)) {
    return new Uint8Array(bytes)
  }


  throw new Error(`Cannot normalize bytes of type ${typeof bytes}: ${bytes}`)
}

/**
 * sortSlice sorts a slice in ascending order.
 * Handles all slice types including null, arrays, Uint8Array, and SliceProxy.
 * @param s The slice to sort in place
 */
export function sortSlice<T extends string | number>(s: Slice<T>): void {
  if (s === null || s === undefined) {
    return // Nothing to sort for nil slice
  }

  if (Array.isArray(s)) {
    s.sort()
    return
  }

  if (s instanceof Uint8Array) {
    s.sort()
    return
  }

  // Handle SliceProxy case - sort the backing array in-place within the slice bounds
  if (isSliceProxy(s)) {
    const proxy = s as SliceProxy<T>
    const meta = proxy.__meta__
    const section = meta.backing.slice(meta.offset, meta.offset + meta.length)
    section.sort()
    // Copy sorted section back to the backing array
    for (let i = 0; i < section.length; i++) {
      meta.backing[meta.offset + i] = section[i]
    }
    return
  }
}

/**
 * bytesEqual efficiently compares two byte slices for equality.
 * Optimized for different byte representations.
 */
export function bytesEqual(a: Bytes | null, b: Bytes | null): boolean {
  // Handle null cases
  if (a === null && b === null) return true
  if (a === null || b === null) return false

  // Convert to arrays for comparison
  const aArr = bytesToArray(a)
  const bArr = bytesToArray(b)

  if (aArr.length !== bArr.length) return false

  for (let i = 0; i < aArr.length; i++) {
    if (aArr[i] !== bArr[i]) return false
  }

  return true
}

/**
 * bytesCompare compares two byte slices lexicographically.
 * Returns -1 if a < b, 0 if a == b, +1 if a > b.
 */
export function bytesCompare(a: Bytes | null, b: Bytes | null): number {
  // Handle null cases
  if (a === null && b === null) return 0
  if (a === null) return -1
  if (b === null) return 1

  const aArr = bytesToArray(a)
  const bArr = bytesToArray(b)

  const minLen = Math.min(aArr.length, bArr.length)

  for (let i = 0; i < minLen; i++) {
    if (aArr[i] < bArr[i]) return -1
    if (aArr[i] > bArr[i]) return 1
  }

  if (aArr.length < bArr.length) return -1
  if (aArr.length > bArr.length) return 1
  return 0
}

/**
 * bytesToArray converts any Bytes representation to a number array.
 */
export function bytesToArray(bytes: Bytes | null): number[] {
  if (bytes === null) return []

  if (bytes instanceof Uint8Array) {
    return Array.from(bytes)
  }

  if (Array.isArray(bytes)) {
    return bytes
  }

  // Handle SliceProxy
  if (isSliceProxy(bytes)) {
    const proxy = bytes as SliceProxy<number>
    const meta = proxy.__meta__
    return meta.backing.slice(meta.offset, meta.offset + meta.length)
  }

  throw new Error(`Cannot convert bytes of type ${typeof bytes} to array`)
}

/**
 * bytesToUint8Array converts any Bytes representation to a Uint8Array.
 */
export function bytesToUint8Array(bytes: Bytes | null): Uint8Array {
  if (bytes === null) return new Uint8Array(0)

  if (bytes instanceof Uint8Array) {
    return bytes
  }

  return new Uint8Array(bytesToArray(bytes))
}

/**
 * bytesIndexOf finds the first occurrence of subslice in bytes.
 * Returns -1 if not found.
 */
export function bytesIndexOf(
  bytes: Bytes | null,
  subslice: Bytes | null,
): number {
  if (bytes === null || subslice === null) return -1

  const haystack = bytesToArray(bytes)
  const needle = bytesToArray(subslice)

  if (needle.length === 0) return 0
  if (needle.length > haystack.length) return -1

  for (let i = 0; i <= haystack.length - needle.length; i++) {
    let found = true
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false
        break
      }
    }
    if (found) return i
  }

  return -1
}

/**
 * bytesLastIndexOf finds the last occurrence of subslice in bytes.
 * Returns -1 if not found.
 */
export function bytesLastIndexOf(
  bytes: Bytes | null,
  subslice: Bytes | null,
): number {
  if (bytes === null || subslice === null) return -1

  const haystack = bytesToArray(bytes)
  const needle = bytesToArray(subslice)

  if (needle.length === 0) return haystack.length
  if (needle.length > haystack.length) return -1

  for (let i = haystack.length - needle.length; i >= 0; i--) {
    let found = true
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) {
        found = false
        break
      }
    }
    if (found) return i
  }

  return -1
}

/**
 * bytesIndexByte finds the first occurrence of byte c in bytes.
 * Returns -1 if not found.
 */
export function bytesIndexByte(bytes: Bytes | null, c: number): number {
  if (bytes === null) return -1

  const arr = bytesToArray(bytes)
  return arr.indexOf(c)
}

/**
 * bytesLastIndexByte finds the last occurrence of byte c in bytes.
 * Returns -1 if not found.
 */
export function bytesLastIndexByte(bytes: Bytes | null, c: number): number {
  if (bytes === null) return -1

  const arr = bytesToArray(bytes)
  return arr.lastIndexOf(c)
}

/**
 * bytesCount counts non-overlapping instances of sep in bytes.
 */
export function bytesCount(bytes: Bytes | null, sep: Bytes | null): number {
  if (bytes === null || sep === null) return 0

  const haystack = bytesToArray(bytes)
  const needle = bytesToArray(sep)

  if (needle.length === 0) {
    // Special case: empty separator counts code points + 1
    // For now, just return length + 1 (ASCII assumption)
    return haystack.length + 1
  }

  let count = 0
  let pos = 0

  while (pos <= haystack.length - needle.length) {
    let found = true
    for (let i = 0; i < needle.length; i++) {
      if (haystack[pos + i] !== needle[i]) {
        found = false
        break
      }
    }
    if (found) {
      count++
      pos += needle.length
    } else {
      pos++
    }
  }

  return count
}

// Math functions needed by various packages
export function min(a: number, b: number): number {
  return Math.min(a, b)
}

export function max(a: number, b: number): number {
  return Math.max(a, b)
}

/**
 * Converts a rune (number) or string to a string.
 * This is used to replace String.fromCharCode() in Go string(rune) conversions.
 * Since sometimes single-char rune literals are compiled to strings, this function
 * needs to handle both numbers (runes) and strings.
 *
 * @param runeOrString A rune (Unicode code point as number) or a string
 * @returns The resulting string
 */
export function runeOrStringToString(runeOrString: number | string): string {
  if (typeof runeOrString === 'string') {
    return runeOrString
  }
  // For numbers, use String.fromCharCode to convert the rune to a string
  return String.fromCharCode(runeOrString)
}

// Panic recovery function (simplified implementation)
export function recover(): any {
  // In a real implementation, this would interact with Go's panic/recover mechanism
  // For now, return null to indicate no panic was recovered
  return null
}
