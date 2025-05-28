import { describe, it, expect } from 'vitest'
import { J0, Y0 } from './j0.gs.js'

describe('J0', () => {
  it('should return correct values for zero and small inputs', () => {
    expect(J0(0)).toBe(1)
    expect(J0(1)).toBeCloseTo(0.7651976865579666, 14)
    expect(J0(2)).toBeCloseTo(0.22389077914123567, 6)
  })

  it('should return correct values for various inputs', () => {
    expect(J0(3)).toBeCloseTo(-0.2600519549019335, 5)
    expect(J0(5)).toBeCloseTo(-0.1775967713143383, 6)
    expect(J0(10)).toBeCloseTo(-0.24593576445134832, 5)
  })

  it('should be an even function', () => {
    const testValues = [1, 2, 3, 5, 10]
    for (const x of testValues) {
      expect(J0(-x)).toBeCloseTo(J0(x), 14)
    }
  })

  it('should handle special values', () => {
    expect(J0(Number.POSITIVE_INFINITY)).toBe(0)
    expect(J0(Number.NEGATIVE_INFINITY)).toBe(0)
    expect(Number.isNaN(J0(Number.NaN))).toBe(true)
  })

  it('should oscillate for large values', () => {
    // J0 should oscillate around 0 for large x
    const largeValues = [20, 30, 50, 100]
    for (const x of largeValues) {
      expect(Math.abs(J0(x))).toBeLessThan(0.5)
    }
  })
})

describe('Y0', () => {
  it('should return correct values for positive inputs', () => {
    expect(Y0(1)).toBeCloseTo(0.08825696421567696, 14)
    expect(Y0(2)).toBeCloseTo(0.5103756726497451, 5)
    expect(Y0(5)).toBeCloseTo(-0.3085176252490338, 5)
  })

  it('should approach negative infinity as x approaches 0 from positive side', () => {
    expect(Y0(0.001)).toBeLessThan(-4)
    expect(Y0(0.0001)).toBeLessThan(-5)
  })

  it('should handle special values', () => {
    expect(Y0(Number.POSITIVE_INFINITY)).toBe(0)
    // Check if Y0(0) returns a very large negative number or -Infinity
    const y0_zero = Y0(0)
    expect(
      y0_zero < -1e10 ||
        y0_zero === Number.NEGATIVE_INFINITY ||
        Number.isNaN(y0_zero),
    ).toBe(true)
    expect(Number.isNaN(Y0(-1))).toBe(true)
    expect(Number.isNaN(Y0(Number.NEGATIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Y0(Number.NaN))).toBe(true)
  })

  it('should oscillate for large values', () => {
    // Y0 should oscillate around 0 for large x
    const largeValues = [20, 30, 50, 100]
    for (const x of largeValues) {
      expect(Math.abs(Y0(x))).toBeLessThan(0.5)
    }
  })

  it('should be undefined for negative values', () => {
    expect(Number.isNaN(Y0(-1))).toBe(true)
    expect(Number.isNaN(Y0(-5))).toBe(true)
    expect(Number.isNaN(Y0(-10))).toBe(true)
  })
})
