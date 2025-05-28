import { ReflectValue } from './types'

// Swapper returns a function that swaps the elements in the provided slice.
// Swapper panics if the provided interface is not a slice.
export function Swapper(slice: ReflectValue): (i: number, j: number) => void {
  let actualArray: unknown[] | null = null

  // Try to extract the underlying array
  if (Array.isArray(slice)) {
    actualArray = slice
  } else if (slice && typeof slice === 'object' && '__meta__' in slice) {
    // GoScript slice object
    const meta = (slice as { __meta__?: { backing?: unknown[] } }).__meta__
    if (meta && meta.backing && Array.isArray(meta.backing)) {
      actualArray = meta.backing
    }
  }

  if (!actualArray) {
    // Return a no-op function if we can't extract an array
    return () => {}
  }

  // Fast path for slices of size 0 and 1. Nothing to swap.
  switch (actualArray.length) {
    case 0:
      return (_i: number, _j: number): void => {
        throw new Error('reflect: slice index out of range')
      }
    case 1:
      return (i: number, j: number): void => {
        if (i !== 0 || j !== 0) {
          throw new Error('reflect: slice index out of range')
        }
      }
  }

  // Return the swapper function
  return (i: number, j: number) => {
    if (
      actualArray &&
      i >= 0 &&
      j >= 0 &&
      i < actualArray.length &&
      j < actualArray.length
    ) {
      const temp = actualArray[i]
      actualArray[i] = actualArray[j]
      actualArray[j] = temp
    }
  }
}
