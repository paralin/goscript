import * as $ from "../builtin/builtin.js";

// Helper type for slice metadata
interface SliceMetadata<T> {
  backing: T[]
  offset: number
  length: number
  capacity: number
}

// Helper function to swap elements in a slice
function swapInSlice<T>(slice: $.Slice<T>, i: number, j: number): void {
  if (!slice) return
  
  const temp = $.index(slice, i)
  if (Array.isArray(slice)) {
    const val_j = $.index(slice, j)
    const val_i = temp
    slice[i] = val_j as T
    slice[j] = val_i as T
  } else if (typeof slice === 'object' && '__meta__' in slice) {
    const meta = (slice as any).__meta__ as SliceMetadata<T>
    const backing = meta.backing
    backing[meta.offset + i] = $.index(slice, j) as T
    backing[meta.offset + j] = temp as T
  }
}

// Slice sorts the slice x given the provided less function
export function Slice(x: $.Slice<any>, less: (i: number, j: number) => boolean): void {
  if (!x) return
  
  // Simple insertion sort using the provided less function
  const n = $.len(x)
  for (let i = 1; i < n; i++) {
    for (let j = i; j > 0 && less(j, j - 1); j--) {
      swapInSlice(x, j, j - 1)
    }
  }
}

// SliceIsSorted reports whether the slice x is sorted according to the provided less function
export function SliceIsSorted(x: $.Slice<any>, less: (i: number, j: number) => boolean): boolean {
  if (!x) return true
  
  const n = $.len(x)
  for (let i = n - 1; i > 0; i--) {
    if (less(i, i - 1)) {
      return false
    }
  }
  return true
}

// SliceStable sorts the slice x while keeping the original order of equal elements
export function SliceStable(x: $.Slice<any>, less: (i: number, j: number) => boolean): void {
  // For simplicity, use the same sort - can be improved later
  Slice(x, less)
} 