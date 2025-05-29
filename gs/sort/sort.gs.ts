import * as $ from '@goscript/builtin/index.js'

// Interface defines the methods required for sorting
export interface Interface {
  Len(): number
  Less(i: number, j: number): boolean
  Swap(i: number, j: number): void
}

// Helper type for slice metadata
interface SliceMetadata<T> {
  backing: T[]
  offset: number
  length: number
  capacity: number
}

// IntSlice type for sorting integers
export class IntSlice {
  constructor(private _value: $.Slice<number>) {}

  Len(): number {
    return $.len(this._value)
  }

  Less(i: number, j: number): boolean {
    return ($.index(this._value, i) as number) < ($.index(this._value, j) as number)
  }

  Swap(i: number, j: number): void {
    const temp = $.index(this._value, i) as number
    if (Array.isArray(this._value)) {
      this._value[i] = $.index(this._value, j) as number
      this._value[j] = temp
    } else if (this._value && typeof this._value === 'object' && '__meta__' in this._value) {
      const meta = (this._value as any).__meta__ as SliceMetadata<number>
      const backing = meta.backing
      backing[meta.offset + i] = $.index(this._value, j) as number
      backing[meta.offset + j] = temp
    }
  }
}

// Float64Slice type for sorting float64s
export class Float64Slice {
  constructor(private _value: $.Slice<number>) {}

  Len(): number {
    return $.len(this._value)
  }

  Less(i: number, j: number): boolean {
    return ($.index(this._value, i) as number) < ($.index(this._value, j) as number)
  }

  Swap(i: number, j: number): void {
    const temp = $.index(this._value, i) as number
    if (Array.isArray(this._value)) {
      this._value[i] = $.index(this._value, j) as number
      this._value[j] = temp
    } else if (this._value && typeof this._value === 'object' && '__meta__' in this._value) {
      const meta = (this._value as any).__meta__ as SliceMetadata<number>
      const backing = meta.backing
      backing[meta.offset + i] = $.index(this._value, j) as number
      backing[meta.offset + j] = temp
    }
  }
}

// StringSlice type for sorting strings
export class StringSlice {
  constructor(private _value: $.Slice<string>) {}

  Len(): number {
    return $.len(this._value)
  }

  Less(i: number, j: number): boolean {
    return ($.index(this._value, i) as string) < ($.index(this._value, j) as string)
  }

  Swap(i: number, j: number): void {
    const temp = $.index(this._value, i) as string
    if (Array.isArray(this._value)) {
      this._value[i] = $.index(this._value, j) as string
      this._value[j] = temp
    } else if (this._value && typeof this._value === 'object' && '__meta__' in this._value) {
      const meta = (this._value as any).__meta__ as SliceMetadata<string>
      const backing = meta.backing
      backing[meta.offset + i] = $.index(this._value, j) as string
      backing[meta.offset + j] = temp
    }
  }
}

// Sort sorts data in ascending order as determined by the Less method
export function Sort(data: Interface): void {
  // Use a simple insertion sort for now - can be optimized later
  const n = data.Len()
  for (let i = 1; i < n; i++) {
    for (let j = i; j > 0 && data.Less(j, j - 1); j--) {
      data.Swap(j, j - 1)
    }
  }
}

// Stable sorts data while keeping the original order of equal elements
export function Stable(data: Interface): void {
  // For simplicity, use the same sort - can be improved later
  Sort(data)
}

// IsSorted reports whether data is sorted
export function IsSorted(data: Interface): boolean {
  const n = data.Len()
  for (let i = n - 1; i > 0; i--) {
    if (data.Less(i, i - 1)) {
      return false
    }
  }
  return true
}

// Reverse returns the reverse order for data
export function Reverse(data: Interface): Interface {
  return {
    Len: () => data.Len(),
    Less: (i: number, j: number) => data.Less(j, i),
    Swap: (i: number, j: number) => data.Swap(i, j)
  }
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

// Ints sorts a slice of ints in increasing order
export function Ints(x: $.Slice<number>): void {
  if (!x) return
  
  const n = $.len(x)
  // Simple insertion sort
  for (let i = 1; i < n; i++) {
    for (let j = i; j > 0 && ($.index(x, j) as number) < ($.index(x, j - 1) as number); j--) {
      swapInSlice(x, j, j - 1)
    }
  }
}

// IntsAreSorted reports whether the slice x is sorted in increasing order
export function IntsAreSorted(x: $.Slice<number>): boolean {
  if (!x) return true
  
  const n = $.len(x)
  for (let i = n - 1; i > 0; i--) {
    if (($.index(x, i) as number) < ($.index(x, i - 1) as number)) {
      return false
    }
  }
  return true
}

// Float64s sorts a slice of float64s in increasing order
export function Float64s(x: $.Slice<number>): void {
  if (!x) return
  
  const n = $.len(x)
  // Simple insertion sort
  for (let i = 1; i < n; i++) {
    for (let j = i; j > 0 && ($.index(x, j) as number) < ($.index(x, j - 1) as number); j--) {
      swapInSlice(x, j, j - 1)
    }
  }
}

// Float64sAreSorted reports whether the slice x is sorted in increasing order
export function Float64sAreSorted(x: $.Slice<number>): boolean {
  if (!x) return true
  
  const n = $.len(x)
  for (let i = n - 1; i > 0; i--) {
    if (($.index(x, i) as number) < ($.index(x, i - 1) as number)) {
      return false
    }
  }
  return true
}

// Strings sorts a slice of strings in increasing order
export function Strings(x: $.Slice<string>): void {
  if (!x) return
  
  const n = $.len(x)
  // Simple insertion sort
  for (let i = 1; i < n; i++) {
    for (let j = i; j > 0 && ($.index(x, j) as string) < ($.index(x, j - 1) as string); j--) {
      swapInSlice(x, j, j - 1)
    }
  }
}

// StringsAreSorted reports whether the slice x is sorted in increasing order
export function StringsAreSorted(x: $.Slice<string>): boolean {
  if (!x) return true
  
  const n = $.len(x)
  for (let i = n - 1; i > 0; i--) {
    if (($.index(x, i) as string) < ($.index(x, i - 1) as string)) {
      return false
    }
  }
  return true
} 