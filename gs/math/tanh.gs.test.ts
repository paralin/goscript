import { describe, it, expect } from 'vitest'
import { Tanh, tanh } from './tanh.gs.js'

describe('Tanh', () => {
  it('should return correct hyperbolic tangent values', () => {
    expect(Tanh(0)).toBe(0)
    expect(Tanh(-0)).toBe(-0)
    expect(Tanh(1)).toBeCloseTo(0.7615941559557649, 14)
    expect(Tanh(-1)).toBeCloseTo(-0.7615941559557649, 14)
    expect(Tanh(2)).toBeCloseTo(0.9640275800758169, 14)
    expect(Tanh(-2)).toBeCloseTo(-0.9640275800758169, 15)
  })

  it('should approach ±1 for large values', () => {
    // Relax tolerance for large values due to JavaScript precision limits
    expect(Tanh(10)).toBeCloseTo(1, 8)
    expect(Tanh(-10)).toBeCloseTo(-1, 8)
    expect(Tanh(100)).toBeCloseTo(1, 8)
    expect(Tanh(-100)).toBeCloseTo(-1, 8)
  })

  it('should handle special values', () => {
    expect(Tanh(Number.POSITIVE_INFINITY)).toBe(1)
    expect(Tanh(Number.NEGATIVE_INFINITY)).toBe(-1)
    expect(Number.isNaN(Tanh(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Tanh(Number.MAX_VALUE)).toBe(1)
    expect(Tanh(-Number.MAX_VALUE)).toBe(-1)
    expect(Tanh(Number.MIN_VALUE)).toBeCloseTo(Number.MIN_VALUE, 14)
    expect(Tanh(-Number.MIN_VALUE)).toBeCloseTo(-Number.MIN_VALUE, 14)
  })

  it('should be bounded between -1 and 1', () => {
    const testValues = [-100, -10, -1, -0.5, 0, 0.5, 1, 10, 100]
    for (const x of testValues) {
      const result = Tanh(x)
      expect(result).toBeGreaterThanOrEqual(-1)
      expect(result).toBeLessThanOrEqual(1)
    }
  })
})

describe('tanh', () => {
  it('should work the same as Tanh', () => {
    expect(tanh(0)).toBe(Tanh(0))
    expect(tanh(1)).toBe(Tanh(1))
    expect(tanh(-1)).toBe(Tanh(-1))
    expect(tanh(Number.POSITIVE_INFINITY)).toBe(Tanh(Number.POSITIVE_INFINITY))
  })
}) 