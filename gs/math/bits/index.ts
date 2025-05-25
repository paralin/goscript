// Minimal stub for math/bits package
// This replaces the auto-generated version that has TypeScript syntax errors

// UintSize is the size of a uint in bits
export const UintSize = 32 // Assuming 32-bit for JavaScript numbers

// --- Leading zeros ---
export function LeadingZeros(x: number): number {
  return Math.clz32(x >>> 0)
}

export function LeadingZeros8(x: number): number {
  return Math.clz32((x & 0xff) << 24)
}

export function LeadingZeros16(x: number): number {
  return Math.clz32((x & 0xffff) << 16)
}

export function LeadingZeros32(x: number): number {
  return Math.clz32(x >>> 0)
}

export function LeadingZeros64(x: bigint): number {
  // For 64-bit, we need to handle it differently
  if (x === 0n) return 64
  let count = 0
  let mask = 1n << 63n
  while ((x & mask) === 0n && count < 64) {
    count++
    mask >>= 1n
  }
  return count
}

// --- Trailing zeros ---
export function TrailingZeros(x: number): number {
  if (x === 0) return UintSize
  return TrailingZeros32(x)
}

export function TrailingZeros8(x: number): number {
  if (x === 0) return 8
  return Math.min(8, TrailingZeros32(x))
}

export function TrailingZeros16(x: number): number {
  if (x === 0) return 16
  return Math.min(16, TrailingZeros32(x))
}

export function TrailingZeros32(x: number): number {
  if (x === 0) return 32
  let count = 0
  while ((x & 1) === 0) {
    count++
    x >>>= 1
  }
  return count
}

export function TrailingZeros64(x: bigint): number {
  if (x === 0n) return 64
  let count = 0
  while ((x & 1n) === 0n && count < 64) {
    count++
    x >>= 1n
  }
  return count
}

// --- Ones count ---
export function OnesCount(x: number): number {
  return OnesCount32(x)
}

export function OnesCount8(x: number): number {
  return OnesCount32(x & 0xff)
}

export function OnesCount16(x: number): number {
  return OnesCount32(x & 0xffff)
}

export function OnesCount32(x: number): number {
  // Brian Kernighan's algorithm
  let count = 0
  x = x >>> 0 // Ensure unsigned
  while (x) {
    count++
    x &= x - 1
  }
  return count
}

export function OnesCount64(x: bigint): number {
  let count = 0
  while (x > 0n) {
    count++
    x &= x - 1n
  }
  return count
}

// --- Rotate left ---
export function RotateLeft(x: number, k: number): number {
  return RotateLeft32(x, k)
}

export function RotateLeft8(x: number, k: number): number {
  const n = 8
  k = k % n
  x = x & 0xff
  return ((x << k) | (x >> (n - k))) & 0xff
}

export function RotateLeft16(x: number, k: number): number {
  const n = 16
  k = k % n
  x = x & 0xffff
  return ((x << k) | (x >> (n - k))) & 0xffff
}

export function RotateLeft32(x: number, k: number): number {
  const n = 32
  k = k % n
  x = x >>> 0 // Ensure unsigned
  return ((x << k) | (x >>> (n - k))) >>> 0
}

export function RotateLeft64(x: bigint, k: number): bigint {
  const n = 64
  k = k % n
  const mask = (1n << 64n) - 1n
  x = x & mask
  return ((x << BigInt(k)) | (x >> BigInt(n - k))) & mask
}

// --- Reverse ---
export function Reverse(x: number): number {
  return Reverse32(x)
}

export function Reverse8(x: number): number {
  x = x & 0xff
  x = ((x & 0xf0) >> 4) | ((x & 0x0f) << 4)
  x = ((x & 0xcc) >> 2) | ((x & 0x33) << 2)
  x = ((x & 0xaa) >> 1) | ((x & 0x55) << 1)
  return x
}

export function Reverse16(x: number): number {
  x = x & 0xffff
  x = ((x & 0xff00) >> 8) | ((x & 0x00ff) << 8)
  x = ((x & 0xf0f0) >> 4) | ((x & 0x0f0f) << 4)
  x = ((x & 0xcccc) >> 2) | ((x & 0x3333) << 2)
  x = ((x & 0xaaaa) >> 1) | ((x & 0x5555) << 1)
  return x
}

export function Reverse32(x: number): number {
  x = x >>> 0 // Ensure unsigned
  x = ((x & 0xffff0000) >>> 16) | ((x & 0x0000ffff) << 16)
  x = ((x & 0xff00ff00) >>> 8) | ((x & 0x00ff00ff) << 8)
  x = ((x & 0xf0f0f0f0) >>> 4) | ((x & 0x0f0f0f0f) << 4)
  x = ((x & 0xcccccccc) >>> 2) | ((x & 0x33333333) << 2)
  x = ((x & 0xaaaaaaaa) >>> 1) | ((x & 0x55555555) << 1)
  return x >>> 0
}

export function Reverse64(x: bigint): bigint {
  // Implement 64-bit reverse using similar bit manipulation
  const mask = (1n << 64n) - 1n
  x = x & mask

  // Swap 32-bit halves
  x = ((x & 0xffffffff00000000n) >> 32n) | ((x & 0x00000000ffffffffn) << 32n)
  // Swap 16-bit chunks
  x = ((x & 0xffff0000ffff0000n) >> 16n) | ((x & 0x0000ffff0000ffffn) << 16n)
  // Swap 8-bit chunks
  x = ((x & 0xff00ff00ff00ff00n) >> 8n) | ((x & 0x00ff00ff00ff00ffn) << 8n)
  // Swap 4-bit chunks
  x = ((x & 0xf0f0f0f0f0f0f0f0n) >> 4n) | ((x & 0x0f0f0f0f0f0f0f0fn) << 4n)
  // Swap 2-bit chunks
  x = ((x & 0xccccccccccccccccn) >> 2n) | ((x & 0x3333333333333333n) << 2n)
  // Swap 1-bit chunks
  x = ((x & 0xaaaaaaaaaaaaaaaan) >> 1n) | ((x & 0x5555555555555555n) << 1n)

  return x & mask
}

// --- ReverseBytes ---
export function ReverseBytes(x: number): number {
  return ReverseBytes32(x)
}

export function ReverseBytes16(x: number): number {
  return ((x & 0xff) << 8) | ((x & 0xff00) >> 8)
}

export function ReverseBytes32(x: number): number {
  x = x >>> 0 // Ensure unsigned
  return (
    (((x & 0xff) << 24) |
      ((x & 0xff00) << 8) |
      ((x & 0xff0000) >> 8) |
      ((x & 0xff000000) >>> 24)) >>>
    0
  )
}

export function ReverseBytes64(x: bigint): bigint {
  const mask = (1n << 64n) - 1n
  x = x & mask

  return (
    (((x & 0xffn) << 56n) |
      ((x & 0xff00n) << 40n) |
      ((x & 0xff0000n) << 24n) |
      ((x & 0xff000000n) << 8n) |
      ((x & 0xff00000000n) >> 8n) |
      ((x & 0xff0000000000n) >> 24n) |
      ((x & 0xff000000000000n) >> 40n) |
      ((x & 0xff00000000000000n) >> 56n)) &
    mask
  )
}

// --- Len ---
export function Len(x: number): number {
  return Len32(x)
}

export function Len8(x: number): number {
  return 8 - LeadingZeros8(x)
}

export function Len16(x: number): number {
  return 16 - LeadingZeros16(x)
}

export function Len32(x: number): number {
  return 32 - LeadingZeros32(x)
}

export function Len64(x: bigint): number {
  return 64 - LeadingZeros64(x)
}

// --- Multiplication functions ---
export function Mul(x: number, y: number): [number, number] {
  return Mul32(x, y)
}

export function Mul32(x: number, y: number): [number, number] {
  // For 32-bit multiplication, we can use JavaScript's number precision
  const result = (x >>> 0) * (y >>> 0)
  const hi = Math.floor(result / 0x100000000) >>> 0
  const lo = result >>> 0
  return [hi, lo]
}

export function Mul64(x: bigint, y: bigint): [bigint, bigint] {
  const mask32 = 0xffffffffn

  // Split into 32-bit parts
  const x0 = x & mask32
  const x1 = x >> 32n
  const y0 = y & mask32
  const y1 = y >> 32n

  // Multiply parts
  const p00 = x0 * y0
  const p01 = x0 * y1
  const p10 = x1 * y0
  const p11 = x1 * y1

  // Combine results
  const lo = p00 + ((p01 + p10) << 32n)
  const hi = p11 + ((p01 + p10) >> 32n) + (lo < p00 ? 1n : 0n)

  return [hi, lo]
}

// --- Division functions ---
export function Div(hi: number, lo: number, y: number): [number, number] {
  return Div32(hi, lo, y)
}

export function Div32(hi: number, lo: number, y: number): [number, number] {
  if (y === 0) {
    throw new Error('division by zero')
  }

  // Combine hi and lo into a 64-bit value using BigInt for precision
  const dividend = (BigInt(hi >>> 0) << 32n) | BigInt(lo >>> 0)
  const divisor = BigInt(y >>> 0)

  const quotient = dividend / divisor
  const remainder = dividend % divisor

  return [Number(quotient), Number(remainder)]
}

export function Div64(hi: bigint, lo: bigint, y: bigint): [bigint, bigint] {
  if (y === 0n) {
    throw new Error('division by zero')
  }

  // Combine hi and lo into a 128-bit value (simulated)
  // For simplicity, we'll use a basic implementation
  const dividend = (hi << 64n) | lo
  const quotient = dividend / y
  const remainder = dividend % y

  return [quotient, remainder]
}

// --- Add and Sub with carry ---
export function Add(x: number, y: number, carry: number): [number, number] {
  return Add32(x, y, carry)
}

export function Add32(x: number, y: number, carry: number): [number, number] {
  const sum = (x >>> 0) + (y >>> 0) + (carry >>> 0)
  const result = sum >>> 0
  const carryOut = sum > 0xffffffff ? 1 : 0
  return [result, carryOut]
}

export function Add64(x: bigint, y: bigint, carry: bigint): [bigint, bigint] {
  const mask = (1n << 64n) - 1n
  const sum = (x & mask) + (y & mask) + (carry & mask)
  const result = sum & mask
  const carryOut = sum > mask ? 1n : 0n
  return [result, carryOut]
}

export function Sub(x: number, y: number, borrow: number): [number, number] {
  return Sub32(x, y, borrow)
}

export function Sub32(x: number, y: number, borrow: number): [number, number] {
  const diff = (x >>> 0) - (y >>> 0) - (borrow >>> 0)
  const result = diff >>> 0
  const borrowOut = diff < 0 ? 1 : 0
  return [result, borrowOut]
}

export function Sub64(x: bigint, y: bigint, borrow: bigint): [bigint, bigint] {
  const mask = (1n << 64n) - 1n
  const diff = (x & mask) - (y & mask) - (borrow & mask)
  const result = diff & mask
  const borrowOut = diff < 0n ? 1n : 0n
  return [result, borrowOut]
}
