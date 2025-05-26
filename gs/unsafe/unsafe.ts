// Package unsafe provides facilities for low-level programming including operations
// that violate the type system. Most operations are not supported in JavaScript/TypeScript
// and will throw errors when used.

// ArbitraryType is a shorthand for an arbitrary Go type; it is not a real type
export type ArbitraryType = any

// Pointer is a pointer type but a Pointer value may not be dereferenced
export type Pointer = any

// IntegerType is a shorthand for an integer type; it is not a real type
// This is the only type from unsafe that can be meaningfully implemented in JavaScript
export type IntegerType = number

// Alignof returns the alignment of the (type of the) variable in bytes
// This operation is not meaningful in JavaScript/TypeScript
export function Alignof(_variable: ArbitraryType): number {
  throw new Error(
    'unsafe.Alignof is not supported in JavaScript/TypeScript: memory alignment is not a meaningful concept in JavaScript',
  )
}

// Offsetof returns the field offset in bytes relative to the struct's address
// This operation is not meaningful in JavaScript/TypeScript
export function Offsetof(_selector: ArbitraryType): number {
  throw new Error(
    'unsafe.Offsetof is not supported in JavaScript/TypeScript: memory layout and field offsets are not meaningful concepts in JavaScript',
  )
}

// Sizeof returns the size of the (type of the) variable in bytes
// This operation is not meaningful in JavaScript/TypeScript
export function Sizeof(_variable: ArbitraryType): number {
  throw new Error(
    'unsafe.Sizeof is not supported in JavaScript/TypeScript: memory size is not a meaningful concept in JavaScript',
  )
}

// Add adds len to ptr and returns the updated pointer
// Pointer arithmetic is not supported in JavaScript/TypeScript
export function Add(_ptr: Pointer, _len: IntegerType): Pointer {
  throw new Error(
    'unsafe.Add is not supported in JavaScript/TypeScript: pointer arithmetic is not available in JavaScript',
  )
}

// Slice returns a slice whose underlying array starts at ptr
// This operation is not meaningful in JavaScript/TypeScript
export function Slice(_ptr: Pointer, _len: IntegerType): any[] {
  throw new Error(
    'unsafe.Slice is not supported in JavaScript/TypeScript: direct memory access is not available in JavaScript',
  )
}

// SliceData returns a pointer to the underlying array of the slice
// This operation is not meaningful in JavaScript/TypeScript
export function SliceData(_slice: any[]): Pointer {
  throw new Error(
    'unsafe.SliceData is not supported in JavaScript/TypeScript: direct memory access is not available in JavaScript',
  )
}

// String returns a string value whose underlying bytes start at ptr
// This operation is not meaningful in JavaScript/TypeScript
export function String(_ptr: Pointer, _len: IntegerType): string {
  throw new Error(
    'unsafe.String is not supported in JavaScript/TypeScript: direct memory access is not available in JavaScript',
  )
}

// StringData returns a pointer to the underlying bytes of the str
// This operation is not meaningful in JavaScript/TypeScript
export function StringData(_str: string): Pointer {
  throw new Error(
    'unsafe.StringData is not supported in JavaScript/TypeScript: direct memory access is not available in JavaScript',
  )
}
