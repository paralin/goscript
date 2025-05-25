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
