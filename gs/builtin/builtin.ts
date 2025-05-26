export * from './varRef.js'
export * from './channel.js'
export * from './defer.js'
export * from './io.js'
export * from './map.js'
export * from './slice.js'
export * from './type.js'

// int converts a value to a Go int type, handling proper signed integer conversion
// This ensures that values like 2147483648 (2^31) are properly handled according to Go semantics
export function int(value: number): number {
  // In Go, int is typically 64-bit on 64-bit systems, but for compatibility with JavaScript
  // we need to handle the conversion properly. The issue is that JavaScript's number type
  // can represent values larger than 32-bit signed integers, but when cast in certain contexts
  // they get interpreted as signed 32-bit integers.
  
  // For Go's int type on 64-bit systems, we should preserve the full value
  // since JavaScript numbers can safely represent integers up to Number.MAX_SAFE_INTEGER
  return Math.trunc(value)
}

// Copy is the Go builtin function that copies the contents of one slice to another.
// It returns the number of elements copied.
export function copy<T>(
  dst: T[] | Uint8Array,
  src: T[] | Uint8Array | string,
): number {
  // Handle string to Uint8Array copy (common in Go)
  if (typeof src === 'string' && dst instanceof Uint8Array) {
    const encoder = new TextEncoder()
    const srcBytes = encoder.encode(src)
    const n = Math.min(dst.length, srcBytes.length)
    for (let i = 0; i < n; i++) {
      dst[i] = srcBytes[i]
    }
    return n
  }

  // Handle Uint8Array to Uint8Array copy
  if (dst instanceof Uint8Array && src instanceof Uint8Array) {
    const n = Math.min(dst.length, src.length)
    for (let i = 0; i < n; i++) {
      dst[i] = src[i]
    }
    return n
  }

  // Handle array to array copy (original implementation)
  if (Array.isArray(dst) && Array.isArray(src)) {
    const n = Math.min(dst.length, src.length)
    for (let i = 0; i < n; i++) {
      dst[i] = src[i]
    }
    return n
  }

  // Handle mixed types - convert to compatible format
  if (dst instanceof Uint8Array && Array.isArray(src)) {
    const n = Math.min(dst.length, src.length)
    for (let i = 0; i < n; i++) {
      dst[i] = src[i] as number
    }
    return n
  }

  if (Array.isArray(dst) && src instanceof Uint8Array) {
    const n = Math.min(dst.length, src.length)
    for (let i = 0; i < n; i++) {
      dst[i] = src[i] as T
    }
    return n
  }

  throw new Error(
    `Unsupported copy operation between ${typeof dst} and ${typeof src}`,
  )
}

// Duration multiplication helper for time package operations
// Handles expressions like time.Hour * 24
export function multiplyDuration(duration: any, multiplier: number): any {
  // Check if duration has a multiply method (like our Duration class)
  if (duration && typeof duration.multiply === 'function') {
    return duration.multiply(multiplier)
  }

  // Check if duration has a valueOf method for numeric operations
  if (duration && typeof duration.valueOf === 'function') {
    const numValue = duration.valueOf()
    // Return an object with the same structure but multiplied value
    if (typeof numValue === 'number') {
      // Try to create a new instance of the same type
      if (duration.constructor) {
        return new duration.constructor(numValue * multiplier)
      }
      // Fallback: return a simple object with valueOf
      return {
        valueOf: () => numValue * multiplier,
        toString: () => (numValue * multiplier).toString() + 'ns',
      }
    }
  }

  // Fallback for simple numeric values
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
    | { data: number[] }
    | { valueOf(): number[] },
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

  // Handle objects with valueOf() method that returns a number array
  if (
    bytes &&
    typeof bytes === 'object' &&
    'valueOf' in bytes &&
    typeof bytes.valueOf === 'function'
  ) {
    const value = bytes.valueOf()
    if (Array.isArray(value)) {
      return new Uint8Array(value)
    }
  }

  throw new Error(`Cannot normalize bytes of type ${typeof bytes}: ${bytes}`)
}
