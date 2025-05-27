import { describe, it, expect } from 'vitest'
import { Asinh, asinh } from './asinh.gs.js'

describe('Asinh', () => {
  it('should return correct inverse hyperbolic sine values', () => {
    expect(Asinh(0)).toBe(0)
    expect(Asinh(-0)).toBe(-0)
    expect(Asinh(1)).toBeCloseTo(0.8813735870195429, 14)
    expect(Asinh(-1)).toBeCloseTo(-0.8813735870195429, 14)
    expect(Asinh(2)).toBeCloseTo(1.4436354751788103, 14)
    expect(Asinh(-2)).toBeCloseTo(-1.4436354751788103, 14)
  })

  it('should handle special values', () => {
    expect(Asinh(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Asinh(Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Asinh(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    // For very large values, result should be very large but may not be exactly infinity
    const resultPos = Asinh(Number.MAX_VALUE)
    expect(resultPos > 700 || resultPos === Number.POSITIVE_INFINITY).toBe(true)
    const resultNeg = Asinh(-Number.MAX_VALUE)
    expect(resultNeg < -700 || resultNeg === Number.NEGATIVE_INFINITY).toBe(true)
    expect(Asinh(Number.MIN_VALUE)).toBeCloseTo(Number.MIN_VALUE, 14)
  })
})

describe('asinh', () => {
  it('should work the same as Asinh', () => {
    expect(asinh(0)).toBe(Asinh(0))
    expect(asinh(1)).toBe(Asinh(1))
    expect(asinh(-1)).toBe(Asinh(-1))
    expect(asinh(Number.POSITIVE_INFINITY)).toBe(Asinh(Number.POSITIVE_INFINITY))
  })
}) 