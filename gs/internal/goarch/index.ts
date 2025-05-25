// Architecture constants for JavaScript/WebAssembly target
// This replaces the auto-generated version with appropriate values for JS

// Pointer size in bytes (64-bit in modern JavaScript environments)
export const PtrSize = 8

// JavaScript is little-endian
export const BigEndian = false

// Architecture family
export const ArchFamily = 'wasm'

// Other common architecture constants
export const Int64Align = 8
export const MinFrameSize = 0

// CPU cache line size (not really applicable in JS, but some code might reference it)
export const CacheLineSize = 64
