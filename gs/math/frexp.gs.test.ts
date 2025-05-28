import { describe, it, expect } from 'vitest'
import { Frexp, frexp } from './frexp.gs.js'
import { Inf, NaN as GoNaN, IsNaN } from './bits.gs.js'

describe('Frexp', () => {
  it('should break numbers into normalized fraction and exponent', () => {
    // Test basic cases where we can verify the math
    let [frac, exp] = Frexp(8)
    expect(frac).toBeCloseTo(0.5, 10)
    expect(exp).toBe(4) // 8 = 0.5 * 2^4

    ;[frac, exp] = Frexp(1)
    expect(frac).toBeCloseTo(0.5, 10)
    expect(exp).toBe(1) // 1 = 0.5 * 2^1

    ;[frac, exp] = Frexp(2)
    expect(frac).toBeCloseTo(0.5, 10)
    expect(exp).toBe(2) // 2 = 0.5 * 2^2

    ;[frac, exp] = Frexp(4)
    expect(frac).toBeCloseTo(0.5, 10)
    expect(exp).toBe(3) // 4 = 0.5 * 2^3
  })

  it('should handle fractional numbers', () => {
    let [frac, exp] = Frexp(0.5)
    expect(frac).toBeCloseTo(0.5, 10)
    expect(exp).toBe(0) // 0.5 = 0.5 * 2^0

    ;[frac, exp] = Frexp(0.25)
    expect(frac).toBeCloseTo(0.5, 10)
    expect(exp).toBe(-1) // 0.25 = 0.5 * 2^-1

    ;[frac, exp] = Frexp(0.125)
    expect(frac).toBeCloseTo(0.5, 10)
    expect(exp).toBe(-2) // 0.125 = 0.5 * 2^-2
  })

  it('should handle negative numbers', () => {
    let [frac, exp] = Frexp(-8)
    expect(frac).toBeCloseTo(-0.5, 10)
    expect(exp).toBe(4) // -8 = -0.5 * 2^4

    ;[frac, exp] = Frexp(-1)
    expect(frac).toBeCloseTo(-0.5, 10)
    expect(exp).toBe(1) // -1 = -0.5 * 2^1

    ;[frac, exp] = Frexp(-0.5)
    expect(frac).toBeCloseTo(-0.5, 10)
    expect(exp).toBe(0) // -0.5 = -0.5 * 2^0
  })

  it('should handle zero values', () => {
    let [frac, exp] = Frexp(0)
    expect(frac).toBe(0)
    expect(exp).toBe(0)

    ;[frac, exp] = Frexp(-0)
    expect(frac).toBe(-0)
    expect(exp).toBe(0)
    expect(Object.is(frac, -0)).toBe(true) // Preserve sign of zero
  })

  it('should handle infinity cases', () => {
    let [frac, exp] = Frexp(Inf(1))
    expect(frac).toBe(Inf(1))
    expect(exp).toBe(0)

    ;[frac, exp] = Frexp(Inf(-1))
    expect(frac).toBe(Inf(-1))
    expect(exp).toBe(0)
  })

  it('should handle NaN cases', () => {
    let [frac, _exp] = Frexp(GoNaN())
    expect(IsNaN(frac)).toBe(true)
    expect(_exp).toBe(0)
  })

  it('should satisfy the fundamental property f = frac * 2^exp', () => {
    const testValues = [
      1, 2, 3, 4, 5, 8, 16, 0.5, 0.25, 0.125, 1.5, 3.14159, 100, 1000,
    ]

    testValues.forEach((value) => {
      const [frac, exp] = Frexp(value)
      const reconstructed = frac * Math.pow(2, exp)
      expect(reconstructed).toBeCloseTo(value, 10)
    })

    // Test negative values
    testValues.forEach((value) => {
      const [frac, exp] = Frexp(-value)
      const reconstructed = frac * Math.pow(2, exp)
      expect(reconstructed).toBeCloseTo(-value, 10)
    })
  })

  it('should ensure fraction is in range [0.5, 1) for positive numbers', () => {
    const testValues = [
      1, 2, 3, 4, 5, 8, 16, 0.5, 0.25, 0.125, 1.5, 3.14159, 100, 1000,
    ]

    testValues.forEach((value) => {
      const [frac, _exp] = Frexp(value)
      if (value !== 0) {
        expect(Math.abs(frac)).toBeGreaterThanOrEqual(0.5)
        expect(Math.abs(frac)).toBeLessThan(1)
      }
    })
  })

  it('should handle very large numbers', () => {
    const large = 1e100
    const [frac, exp] = Frexp(large)
    expect(Math.abs(frac)).toBeGreaterThanOrEqual(0.5)
    expect(Math.abs(frac)).toBeLessThan(1)
    expect(frac * Math.pow(2, exp)).toBeCloseTo(large, 5)
  })

  it('should handle very small numbers', () => {
    const small = 1e-100
    const [frac, exp] = Frexp(small)
    expect(Math.abs(frac)).toBeGreaterThanOrEqual(0.5)
    expect(Math.abs(frac)).toBeLessThan(1)
    expect(frac * Math.pow(2, exp)).toBeCloseTo(small, 110)
  })
})

describe('frexp (lowercase)', () => {
  it('should work identically to Frexp', () => {
    const testValues = [0, 1, 2, 4, 8, 0.5, 0.25, -1, -2, 3.14159]

    testValues.forEach((value) => {
      const [frac1, exp1] = Frexp(value)
      const [frac2, exp2] = frexp(value)
      expect(frac1).toBe(frac2)
      expect(exp1).toBe(exp2)
    })

    // Test special cases
    expect(frexp(Inf(1))).toEqual(Frexp(Inf(1)))
    expect(frexp(Inf(-1))).toEqual(Frexp(Inf(-1)))

    const [fracNaN1, expNaN1] = frexp(GoNaN())
    const [fracNaN2, expNaN2] = Frexp(GoNaN())
    expect(IsNaN(fracNaN1)).toBe(IsNaN(fracNaN2))
    expect(expNaN1).toBe(expNaN2)
  })
})
