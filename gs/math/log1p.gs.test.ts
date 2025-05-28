import { describe, it, expect } from 'vitest'
import { Log1p, log1p } from './log1p.gs.js'

describe('Log1p', () => {
  it('should return correct values for zero', () => {
    expect(Log1p(0)).toBe(0)
    expect(Log1p(-0)).toBe(-0)
  })

  it('should return correct values for small inputs', () => {
    expect(Log1p(1e-10)).toBeCloseTo(1e-10, 15)
    expect(Log1p(-1e-10)).toBeCloseTo(-1e-10, 15)
    expect(Log1p(1e-15)).toBeCloseTo(1e-15, 15)
  })

  it('should return correct values for normal inputs', () => {
    expect(Log1p(Math.E - 1)).toBeCloseTo(1, 15)
    expect(Log1p(0.5)).toBeCloseTo(Math.log(1.5), 15)
    expect(Log1p(1)).toBeCloseTo(Math.log(2), 15)
    expect(Log1p(9)).toBeCloseTo(Math.log(10), 15)
  })

  it('should handle special values', () => {
    expect(Log1p(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Log1p(-1)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Log1p(Number.NaN))).toBe(true)
  })

  it('should return NaN for x < -1', () => {
    expect(Number.isNaN(Log1p(-1.1))).toBe(true)
    expect(Number.isNaN(Log1p(-2))).toBe(true)
    expect(Number.isNaN(Log1p(-10))).toBe(true)
    expect(Number.isNaN(Log1p(Number.NEGATIVE_INFINITY))).toBe(true)
  })

  it('should be more accurate than log(1 + x) for small x', () => {
    const x = 1e-15
    const log1pResult = Log1p(x)
    const logResult = Math.log(1 + x)

    // For very small x, log1p should be more accurate
    expect(Math.abs(log1pResult - x)).toBeLessThan(Math.abs(logResult - x))
  })
})

describe('log1p', () => {
  it('should work the same as Log1p', () => {
    expect(log1p(0)).toBe(Log1p(0))
    expect(log1p(1)).toBe(Log1p(1))
    expect(log1p(-0.5)).toBe(Log1p(-0.5))
    expect(log1p(0.5)).toBe(Log1p(0.5))
    expect(Number.isNaN(log1p(Number.NaN))).toBe(true)
    expect(Number.isNaN(log1p(-2))).toBe(true)
  })
})
