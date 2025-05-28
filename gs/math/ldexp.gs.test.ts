import { describe, it, expect } from 'vitest'
import { Ldexp, ldexp } from './ldexp.gs.js'
import { Frexp } from './frexp.gs.js'
import { Inf, NaN as GoNaN, IsNaN } from './bits.gs.js'

describe('Ldexp', () => {
  it('should compute frac × 2^exp correctly for basic cases', () => {
    expect(Ldexp(0.5, 1)).toBe(1) // 0.5 × 2^1 = 1
    expect(Ldexp(0.5, 2)).toBe(2) // 0.5 × 2^2 = 2
    expect(Ldexp(0.5, 3)).toBe(4) // 0.5 × 2^3 = 4
    expect(Ldexp(0.5, 4)).toBe(8) // 0.5 × 2^4 = 8
    expect(Ldexp(1, 0)).toBe(1) // 1 × 2^0 = 1
    expect(Ldexp(1, 1)).toBe(2) // 1 × 2^1 = 2
  })

  it('should handle negative exponents', () => {
    expect(Ldexp(0.5, 0)).toBe(0.5) // 0.5 × 2^0 = 0.5
    expect(Ldexp(0.5, -1)).toBe(0.25) // 0.5 × 2^-1 = 0.25
    expect(Ldexp(0.5, -2)).toBe(0.125) // 0.5 × 2^-2 = 0.125
    expect(Ldexp(1, -1)).toBe(0.5) // 1 × 2^-1 = 0.5
    expect(Ldexp(2, -1)).toBe(1) // 2 × 2^-1 = 1
  })

  it('should handle negative fractions', () => {
    expect(Ldexp(-0.5, 1)).toBe(-1) // -0.5 × 2^1 = -1
    expect(Ldexp(-0.5, 2)).toBe(-2) // -0.5 × 2^2 = -2
    expect(Ldexp(-1, 1)).toBe(-2) // -1 × 2^1 = -2
    expect(Ldexp(-0.5, -1)).toBe(-0.25) // -0.5 × 2^-1 = -0.25
  })

  it('should handle zero values', () => {
    expect(Ldexp(0, 5)).toBe(0) // 0 × 2^5 = 0
    expect(Ldexp(0, -5)).toBe(0) // 0 × 2^-5 = 0
    expect(Ldexp(0, 0)).toBe(0) // 0 × 2^0 = 0

    // Preserve sign of zero
    expect(Ldexp(-0, 5)).toBe(-0)
    expect(Object.is(Ldexp(-0, 5), -0)).toBe(true)
  })

  it('should handle infinity cases', () => {
    expect(Ldexp(Inf(1), 5)).toBe(Inf(1)) // +Inf × 2^5 = +Inf
    expect(Ldexp(Inf(1), -5)).toBe(Inf(1)) // +Inf × 2^-5 = +Inf
    expect(Ldexp(Inf(-1), 5)).toBe(Inf(-1)) // -Inf × 2^5 = -Inf
    expect(Ldexp(Inf(-1), -5)).toBe(Inf(-1)) // -Inf × 2^-5 = -Inf
    expect(Ldexp(Inf(1), 0)).toBe(Inf(1)) // +Inf × 2^0 = +Inf
  })

  it('should handle NaN cases', () => {
    expect(IsNaN(Ldexp(GoNaN(), 5))).toBe(true)
    expect(IsNaN(Ldexp(GoNaN(), -5))).toBe(true)
    expect(IsNaN(Ldexp(GoNaN(), 0))).toBe(true)
  })

  it('should be the inverse of Frexp', () => {
    const testValues = [
      1, 2, 3, 4, 5, 8, 16, 0.5, 0.25, 0.125, 1.5, 3.14159, 100, 1000,
    ]

    testValues.forEach((value) => {
      const [frac, exp] = Frexp(value)
      const reconstructed = Ldexp(frac, exp)
      expect(reconstructed).toBeCloseTo(value, 10)
    })

    // Test negative values
    testValues.forEach((value) => {
      const [frac, exp] = Frexp(-value)
      const reconstructed = Ldexp(frac, exp)
      expect(reconstructed).toBeCloseTo(-value, 10)
    })
  })

  it('should handle large exponents', () => {
    // Test with large positive exponent
    expect(Ldexp(0.5, 10)).toBe(512) // 0.5 × 2^10 = 512
    expect(Ldexp(1, 10)).toBe(1024) // 1 × 2^10 = 1024

    // Test with large negative exponent
    expect(Ldexp(1, -10)).toBeCloseTo(1 / 1024, 10) // 1 × 2^-10 = 1/1024
    expect(Ldexp(2, -10)).toBeCloseTo(2 / 1024, 10) // 2 × 2^-10 = 2/1024
  })

  it('should handle very large exponents that cause overflow', () => {
    // Very large positive exponent should cause overflow to infinity
    expect(Ldexp(1, 1024)).toBe(Number.POSITIVE_INFINITY)
    expect(Ldexp(2, 1023)).toBe(Number.POSITIVE_INFINITY)

    // Very large negative exponent should cause underflow to zero or very small number
    const result = Ldexp(1, -1024)
    expect(result).toBeLessThan(1e-300)
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('should handle fractional inputs correctly', () => {
    expect(Ldexp(0.75, 2)).toBe(3) // 0.75 × 2^2 = 3
    expect(Ldexp(0.25, 3)).toBe(2) // 0.25 × 2^3 = 2
    expect(Ldexp(1.5, 1)).toBe(3) // 1.5 × 2^1 = 3
    expect(Ldexp(1.25, 2)).toBe(5) // 1.25 × 2^2 = 5
  })

  it('should be equivalent to frac * Math.pow(2, exp)', () => {
    const testCases = [
      [0.5, 1],
      [0.5, 2],
      [0.5, -1],
      [1, 5],
      [1.5, 3],
      [0.25, 4],
      [-0.5, 2],
      [-1, -3],
      [2.5, -2],
    ]

    testCases.forEach(([frac, exp]) => {
      expect(Ldexp(frac, exp)).toBeCloseTo(frac * Math.pow(2, exp), 10)
    })
  })
})

describe('ldexp (lowercase)', () => {
  it('should work identically to Ldexp', () => {
    const testCases = [
      [0.5, 1],
      [0.5, 2],
      [0.5, -1],
      [1, 5],
      [1.5, 3],
      [0.25, 4],
      [-0.5, 2],
      [-1, -3],
      [0, 5],
      [-0, 5],
    ]

    testCases.forEach(([frac, exp]) => {
      expect(ldexp(frac, exp)).toBe(Ldexp(frac, exp))
    })

    // Test special cases
    expect(ldexp(Inf(1), 5)).toBe(Ldexp(Inf(1), 5))
    expect(ldexp(Inf(-1), 5)).toBe(Ldexp(Inf(-1), 5))
    expect(IsNaN(ldexp(GoNaN(), 5))).toBe(IsNaN(Ldexp(GoNaN(), 5)))
  })
})
