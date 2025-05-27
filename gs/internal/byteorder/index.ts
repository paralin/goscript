import * as $ from "@goscript/builtin/builtin.js";

// Stub implementations for internal/byteorder package
export function LittleEndian(): boolean {
  return true // Assume little endian for JS
}

// Big Endian byte order functions
export function BEUint16(b: $.Bytes): number {
  return (b![0] << 8) | b![1]
}

export function BEUint32(b: $.Bytes): number {
  return (b![0] << 24) | (b![1] << 16) | (b![2] << 8) | b![3]
}

export function BEUint64(b: $.Bytes): number {
  // JavaScript numbers are 64-bit floats, so we'll lose precision for very large integers
  // For our stub purposes, this should be sufficient
  let high = BEUint32(b)
  let low = BEUint32($.goSlice(b, 4, undefined))
  return (high * 0x100000000) + low
}

// Little Endian byte order functions  
export function LEUint16(b: $.Bytes): number {
  return b![0] | (b![1] << 8)
}

export function LEUint32(b: $.Bytes): number {
  return b![0] | (b![1] << 8) | (b![2] << 16) | (b![3] << 24)
}

export function LEUint64(b: $.Bytes): number {
  // JavaScript numbers are 64-bit floats, so we'll lose precision for very large integers
  // For our stub purposes, this should be sufficient
  let low = LEUint32(b)
  let high = LEUint32($.goSlice(b, 4, undefined))
  return low + (high * 0x100000000)
} 