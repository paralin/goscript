import { describe, it, expect } from 'vitest'
import { Pow10 } from './pow10.gs.js'

describe('Pow10', () => {
  it('should return correct powers of 10 for small integers', () => {
    expect(Pow10(0)).toBe(1)
    expect(Pow10(1)).toBe(10)
    expect(Pow10(2)).toBe(100)
    expect(Pow10(3)).toBe(1000)
    expect(Pow10(4)).toBe(10000)
    expect(Pow10(5)).toBe(100000)
  })

  it('should return correct powers of 10 for negative integers', () => {
    expect(Pow10(-1)).toBe(0.1)
    expect(Pow10(-2)).toBe(0.01)
    expect(Pow10(-3)).toBe(0.001)
    expect(Pow10(-4)).toBeCloseTo(0.0001, 15)
    expect(Pow10(-5)).toBeCloseTo(0.00001, 15)
  })

  it('should return correct powers of 10 for fractional exponents', () => {
    expect(Pow10(0.5)).toBeCloseTo(Math.sqrt(10), 15)
    expect(Pow10(1.5)).toBeCloseTo(10 * Math.sqrt(10), 14)
    expect(Pow10(-0.5)).toBeCloseTo(1 / Math.sqrt(10), 15)
  })

  it('should handle large positive exponents', () => {
    expect(Pow10(100)).toBe(1e100)
    expect(Pow10(200)).toBe(1e200)
    expect(Pow10(300)).toBe(1e300)
    expect(Pow10(308)).toBe(1e308)
    expect(Pow10(309)).toBe(Number.POSITIVE_INFINITY)
    expect(Pow10(400)).toBe(Number.POSITIVE_INFINITY)
  })

  it('should handle large negative exponents', () => {
    expect(Pow10(-100)).toBe(1e-100)
    expect(Pow10(-200)).toBe(1e-200)
    expect(Pow10(-300)).toBe(1e-300)
    expect(Pow10(-320)).toBe(1e-320)
    expect(Pow10(-324)).toBe(0)
    expect(Pow10(-400)).toBe(0)
  })

  it('should handle special values', () => {
    expect(Pow10(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Pow10(Number.NEGATIVE_INFINITY)).toBe(0)
    expect(Number.isNaN(Pow10(Number.NaN))).toBe(true)
  })

  it('should match Math.pow(10, n)', () => {
    const testValues = [0, 1, 2, 3, -1, -2, -3, 0.5, 1.5, -0.5, 10, -10]
    for (const n of testValues) {
      expect(Pow10(n)).toBeCloseTo(Math.pow(10, n), 15)
    }
  })
})
