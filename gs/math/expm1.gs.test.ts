import { describe, it, expect } from 'vitest'
import { Expm1, expm1 } from './expm1.gs.js'

describe('Expm1', () => {
  it('should return correct values for small inputs', () => {
    expect(Expm1(0)).toBe(0)
    expect(Expm1(-0)).toBe(-0)
    expect(Expm1(1e-10)).toBeCloseTo(1e-10, 15)
    expect(Expm1(-1e-10)).toBeCloseTo(-1e-10, 15)
  })

  it('should return correct values for normal inputs', () => {
    expect(Expm1(1)).toBeCloseTo(Math.E - 1, 15)
    expect(Expm1(-1)).toBeCloseTo(1 / Math.E - 1, 15)
    expect(Expm1(2)).toBeCloseTo(Math.E * Math.E - 1, 14)
    expect(Expm1(0.5)).toBeCloseTo(Math.sqrt(Math.E) - 1, 15)
  })

  it('should handle special values', () => {
    expect(Expm1(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Expm1(Number.NEGATIVE_INFINITY)).toBe(-1)
    expect(Number.isNaN(Expm1(Number.NaN))).toBe(true)
  })

  it('should handle large values', () => {
    expect(Expm1(710)).toBe(Number.POSITIVE_INFINITY)
    expect(Expm1(-700)).toBeCloseTo(-1, 15)
  })

  it('should be more accurate than exp(x) - 1 for small x', () => {
    const x = 1e-15
    const expm1Result = Expm1(x)
    const expMinus1Result = Math.exp(x) - 1

    // For very small x, expm1 should be more accurate
    expect(Math.abs(expm1Result - x)).toBeLessThan(
      Math.abs(expMinus1Result - x),
    )
  })
})

describe('expm1', () => {
  it('should work the same as Expm1', () => {
    expect(expm1(0)).toBe(Expm1(0))
    expect(expm1(1)).toBe(Expm1(1))
    expect(expm1(-1)).toBe(Expm1(-1))
    expect(expm1(0.5)).toBe(Expm1(0.5))
    expect(Number.isNaN(expm1(Number.NaN))).toBe(true)
  })
})
