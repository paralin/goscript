// Placeholder bytealg module for reflect package compatibility

// Helper function to normalize bytes input
function normalizeBytes(b: any): any[] {
  if (b === null || b === undefined) {
    return []
  }
  if (Array.isArray(b)) {
    return b
  }
  if (b instanceof Uint8Array) {
    return Array.from(b)
  }
  if (b && typeof b === 'object' && 'data' in b && Array.isArray(b.data)) {
    return b.data
  }
  return []
}

// Equal reports whether a and b are the same length and contain the same bytes.
export function Equal(a: any, b: any): boolean {
  const aNorm = normalizeBytes(a)
  const bNorm = normalizeBytes(b)
  if (aNorm.length !== bNorm.length) {
    return false
  }
  for (let i = 0; i < aNorm.length; i++) {
    if (aNorm[i] !== bNorm[i]) {
      return false
    }
  }
  return true
}

// Compare returns an integer comparing two byte slices lexicographically.
export function Compare(a: any, b: any): number {
  const aNorm = normalizeBytes(a)
  const bNorm = normalizeBytes(b)
  const minLen = Math.min(aNorm.length, bNorm.length)
  for (let i = 0; i < minLen; i++) {
    if (aNorm[i] < bNorm[i]) {
      return -1
    }
    if (aNorm[i] > bNorm[i]) {
      return 1
    }
  }
  if (aNorm.length < bNorm.length) {
    return -1
  }
  if (aNorm.length > bNorm.length) {
    return 1
  }
  return 0
}

// Additional functions needed by bytes package
export function Count(s: any, b: number): number {
  const sNorm = normalizeBytes(s)
  let count = 0
  for (let i = 0; i < sNorm.length; i++) {
    if (sNorm[i] === b) {
      count++
    }
  }
  return count
}

export function IndexByte(s: any, b: number): number {
  const sNorm = normalizeBytes(s)
  for (let i = 0; i < sNorm.length; i++) {
    if (sNorm[i] === b) {
      return i
    }
  }
  return -1
}

export function LastIndexByte(s: any, b: number): number {
  const sNorm = normalizeBytes(s)
  for (let i = sNorm.length - 1; i >= 0; i--) {
    if (sNorm[i] === b) {
      return i
    }
  }
  return -1
}

export function Index(s: any, sep: any): number {
  const sNorm = normalizeBytes(s)
  const sepNorm = normalizeBytes(sep)
  if (sepNorm.length === 0) return 0
  if (sepNorm.length > sNorm.length) return -1

  for (let i = 0; i <= sNorm.length - sepNorm.length; i++) {
    let found = true
    for (let j = 0; j < sepNorm.length; j++) {
      if (sNorm[i + j] !== sepNorm[j]) {
        found = false
        break
      }
    }
    if (found) return i
  }
  return -1
}

export function LastIndexRabinKarp(s: any, sep: any): number {
  const sNorm = normalizeBytes(s)
  const sepNorm = normalizeBytes(sep)
  // Simple implementation
  for (let i = sNorm.length - sepNorm.length; i >= 0; i--) {
    let found = true
    for (let j = 0; j < sepNorm.length; j++) {
      if (sNorm[i + j] !== sepNorm[j]) {
        found = false
        break
      }
    }
    if (found) return i
  }
  return -1
}

export function IndexRabinKarp(s: any, sep: any): number {
  return Index(s, sep)
}

export function IndexByteString(s: string, b: number): number {
  const char = String.fromCharCode(b)
  return s.indexOf(char)
}

export function IndexString(s: string, substr: string): number {
  return s.indexOf(substr)
}

export function MakeNoZero(n: number): Uint8Array {
  return new Uint8Array(n)
}

export function Cutover(_n: number): number {
  // TODO: Implement Cutover function
  return 10 // Simple threshold
}

// Constants needed by bytes package
export const MaxBruteForce = 64
export const MaxLen = 32
