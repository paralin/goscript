// Minimal unsafe package implementation for goscript
// This provides stubs for the most commonly used unsafe functions

export type ArbitraryType = any;
export type IntegerType = number;
export type Pointer = any;

// Alignof returns the alignment guarantee of a variable.
// For TypeScript, we return 1 as a safe default.
export function Alignof(x: ArbitraryType): number {
  return 1;
}

// Offsetof returns the offset within the struct of the field.
// For TypeScript, we return 0 as a safe default.
export function Offsetof(x: ArbitraryType): number {
  return 0;
}

// Sizeof returns the size in bytes occupied by the value.
// For TypeScript, we return a reasonable estimate.
export function Sizeof(x: ArbitraryType): number {
  if (x === null || x === undefined) return 8; // pointer size
  if (typeof x === 'number') return 8; // assume 64-bit numbers
  if (typeof x === 'string') return x.length * 2; // UTF-16
  if (typeof x === 'boolean') return 1;
  if (Array.isArray(x)) return x.length * 8; // estimate
  return 8; // default for objects
}

// String creates a string from a byte pointer and length.
// For TypeScript, we create a string from a Uint8Array-like structure.
export function String(ptr: any, len: IntegerType): string {
  // In goscript, byte arrays are typically Uint8Array
  if (ptr && ptr.constructor === Uint8Array) {
    return new TextDecoder().decode(ptr.slice(0, len));
  }
  return '';
}

// StringData returns a pointer to the underlying bytes of a string.
// For TypeScript, we convert string to Uint8Array.
export function StringData(str: string): any {
  return new TextEncoder().encode(str);
}

// Slice creates a slice from a pointer and length.
// For TypeScript, we return the pointer as-is if it's array-like.
export function Slice(ptr: ArbitraryType, len: IntegerType): any[] {
  if (Array.isArray(ptr)) {
    return ptr.slice(0, len);
  }
  if (ptr && ptr.constructor === Uint8Array) {
    return Array.from(ptr.slice(0, len));
  }
  return [];
}

// SliceData returns a pointer to the underlying array of a slice.
// For TypeScript, we return the array itself.
export function SliceData(slice: any[]): ArbitraryType {
  return slice;
}

// Add adds len to ptr and returns the updated pointer.
// For TypeScript, this is mostly a no-op since we don't have real pointer arithmetic.
export function Add(ptr: Pointer, len: IntegerType): Pointer {
  // In a real implementation, this would do pointer arithmetic
  // For goscript, we just return the pointer as-is
  return ptr;
} 