import { describe, it, expect } from 'vitest'
import { Exp, exp, Exp2, exp2, expmulti } from './exp.gs.js'

describe('Exp', () => {
  it('should return correct exponential values', () => {
    expect(Exp(0)).toBe(1)
    expect(Exp(1)).toBeCloseTo(2.718281828459045, 14)
    expect(Exp(-1)).toBeCloseTo(0.36787944117144233, 14)
    expect(Exp(2)).toBeCloseTo(7.38905609893065, 14)
    expect(Exp(-2)).toBeCloseTo(0.1353352832366127, 14)
  })

  it('should handle special values', () => {
    expect(Exp(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Exp(Number.NEGATIVE_INFINITY)).toBe(0)
    expect(Number.isNaN(Exp(Number.NaN))).toBe(true)
  })

  it('should handle large values', () => {
    expect(Exp(710)).toBe(Number.POSITIVE_INFINITY)
    // For very large negative values, result should be very close to 0
    const result = Exp(-710)
    expect(result).toBeLessThan(1e-300)
    expect(result).toBeGreaterThanOrEqual(0)
  })

  it('should handle edge cases', () => {
    expect(Exp(Number.MIN_VALUE)).toBeCloseTo(1, 14)
    expect(Exp(-Number.MIN_VALUE)).toBeCloseTo(1, 14)
  })
})

describe('exp', () => {
  it('should work the same as Exp', () => {
    expect(exp(0)).toBe(Exp(0))
    expect(exp(1)).toBe(Exp(1))
    expect(exp(-1)).toBe(Exp(-1))
    expect(exp(Number.POSITIVE_INFINITY)).toBe(Exp(Number.POSITIVE_INFINITY))
  })
})

describe('Exp2', () => {
  it('should return correct base-2 exponential values', () => {
    expect(Exp2(0)).toBe(1)
    expect(Exp2(1)).toBe(2)
    expect(Exp2(2)).toBe(4)
    expect(Exp2(3)).toBe(8)
    expect(Exp2(-1)).toBe(0.5)
    expect(Exp2(-2)).toBe(0.25)
  })

  it('should handle special values', () => {
    expect(Exp2(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Exp2(Number.NEGATIVE_INFINITY)).toBe(0)
    expect(Number.isNaN(Exp2(Number.NaN))).toBe(true)
  })

  it('should handle large values', () => {
    expect(Exp2(1024)).toBe(Number.POSITIVE_INFINITY)
    // For very large negative values, result should be very close to 0
    const result = Exp2(-1024)
    expect(result).toBeLessThan(1e-300)
    expect(result).toBeGreaterThanOrEqual(0)
  })
})

describe('exp2', () => {
  it('should work the same as Exp2', () => {
    expect(exp2(0)).toBe(Exp2(0))
    expect(exp2(1)).toBe(Exp2(1))
    expect(exp2(-1)).toBe(Exp2(-1))
    expect(exp2(Number.POSITIVE_INFINITY)).toBe(Exp2(Number.POSITIVE_INFINITY))
  })
})

describe('expmulti', () => {
  it('should compute e^r * 2^k correctly', () => {
    expect(expmulti(1, 0, 0)).toBeCloseTo(Math.E, 14)
    expect(expmulti(0, 0, 1)).toBe(2)
    expect(expmulti(1, 0, 1)).toBeCloseTo(Math.E * 2, 14)
  })
})
