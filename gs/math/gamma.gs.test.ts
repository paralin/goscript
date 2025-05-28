import { describe, it, expect } from 'vitest'
import { Gamma } from './gamma.gs.js'

describe('Gamma', () => {
  it('should return correct values for positive integers', () => {
    expect(Gamma(1)).toBe(1)
    expect(Gamma(2)).toBe(1)
    expect(Gamma(3)).toBe(2)
    expect(Gamma(4)).toBe(6)
    expect(Gamma(5)).toBe(24)
  })

  it('should return correct values for half-integers', () => {
    expect(Gamma(0.5)).toBeCloseTo(1.7724538509055159, 14)
    expect(Gamma(1.5)).toBeCloseTo(0.8862269254527579, 14)
    expect(Gamma(2.5)).toBeCloseTo(1.329340388179137, 14)
  })

  it('should handle negative non-integer values', () => {
    expect(Gamma(-0.5)).toBeCloseTo(-3.5449077018110318, 14)
    expect(Gamma(-1.5)).toBeCloseTo(2.363271801207355, 14)
    expect(Gamma(-2.5)).toBeCloseTo(-0.9453087204829419, 14)
  })

  it('should handle special values', () => {
    expect(Gamma(0)).toBe(Number.POSITIVE_INFINITY)
    expect(Gamma(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isNaN(Gamma(Number.NEGATIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Gamma(Number.NaN))).toBe(true)
  })

  it('should return NaN for negative integers', () => {
    expect(Number.isNaN(Gamma(-1))).toBe(true)
    expect(Number.isNaN(Gamma(-2))).toBe(true)
    expect(Number.isNaN(Gamma(-3))).toBe(true)
    expect(Number.isNaN(Gamma(-10))).toBe(true)
  })

  it('should satisfy the recurrence relation Gamma(x+1) = x * Gamma(x)', () => {
    const testValues = [0.5, 1.5, 2.5, 3.5]
    for (const x of testValues) {
      expect(Gamma(x + 1)).toBeCloseTo(x * Gamma(x), 12)
    }
  })

  it('should handle very small positive values', () => {
    // Relax tolerance for very small values due to JavaScript precision limits
    expect(Gamma(1e-10)).toBeCloseTo(9999999999.422785, 1)
    expect(Gamma(1e-5)).toBeCloseTo(99999.42279422554, 0)
  })

  it('should handle large positive values', () => {
    expect(Gamma(10)).toBeCloseTo(362880, 8)
    // Relax tolerance for very large values due to JavaScript precision limits
    expect(Gamma(20)).toBeCloseTo(1.21645100408832e17, 10)
  })

  it('should satisfy reflection formula for negative values', () => {
    // Gamma(x) * Gamma(1-x) = π / sin(πx) for non-integer x
    const x = 0.3
    const gamma_x = Gamma(x)
    const gamma_1_minus_x = Gamma(1 - x)
    const expected = Math.PI / Math.sin(Math.PI * x)
    expect(gamma_x * gamma_1_minus_x).toBeCloseTo(expected, 10)
  })
})
