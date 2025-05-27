import { describe, it, expect } from 'vitest'
import { Acosh, acosh } from './acosh.gs.js'

describe('Acosh', () => {
  it('should return correct inverse hyperbolic cosine values', () => {
    expect(Acosh(1)).toBe(0)
    expect(Acosh(Math.E)).toBeCloseTo(1.6574544541530771, 14)
    expect(Acosh(2)).toBeCloseTo(1.3169578969248166, 14)
    expect(Acosh(10)).toBeCloseTo(2.993222846126381, 14)
  })

  it('should return NaN for values less than 1', () => {
    expect(Number.isNaN(Acosh(0.5))).toBe(true)
    expect(Number.isNaN(Acosh(0))).toBe(true)
    expect(Number.isNaN(Acosh(-1))).toBe(true)
  })

  it('should handle special values', () => {
    expect(Acosh(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isNaN(Acosh(Number.NEGATIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Acosh(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    // For very large values, result should be very large but may not be exactly infinity
    const result = Acosh(Number.MAX_VALUE)
    expect(result > 700 || result === Number.POSITIVE_INFINITY).toBe(true)
    expect(Number.isNaN(Acosh(Number.MIN_VALUE))).toBe(true)
  })
})

describe('acosh', () => {
  it('should work the same as Acosh', () => {
    expect(acosh(1)).toBe(Acosh(1))
    expect(acosh(2)).toBe(Acosh(2))
    expect(acosh(10)).toBe(Acosh(10))
    expect(acosh(Number.POSITIVE_INFINITY)).toBe(Acosh(Number.POSITIVE_INFINITY))
  })
}) 