export * from './varRef.js'
export * from './channel.js'
export * from './defer.js'
export * from './io.js'
export * from './map.js'
export * from './slice.js'
export * from './type.js'

// Copy is the Go builtin function that copies the contents of one slice to another.
// It returns the number of elements copied.
export function copy<T>(dst: T[], src: T[]): number {
  const n = Math.min(dst.length, src.length)
  for (let i = 0; i < n; i++) {
    dst[i] = src[i]
  }
  return n
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
