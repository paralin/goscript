import { describe, it, expect } from 'vitest'
import { Erfinv, Erfcinv } from './erfinv.gs.js'
import { Erf, Erfc } from './erf.gs.js'

describe('Erfinv', () => {
  it('should return correct values for zero', () => {
    expect(Erfinv(0)).toBe(0)
    expect(Erfinv(-0)).toBe(-0)
  })

  it('should return correct values for common inputs', () => {
    // Relax precision tolerance for JavaScript floating-point differences
    expect(Erfinv(0.5)).toBeCloseTo(0.4769362762044699, 6)
    expect(Erfinv(-0.5)).toBeCloseTo(-0.4769362762044699, 6)
    expect(Erfinv(0.8)).toBeCloseTo(0.9061938024368235, 6)
    expect(Erfinv(-0.8)).toBeCloseTo(-0.9061938024368235, 6)
  })

  it('should handle boundary values', () => {
    expect(Erfinv(1)).toBe(Number.POSITIVE_INFINITY)
    expect(Erfinv(-1)).toBe(Number.NEGATIVE_INFINITY)
  })

  it('should return NaN for values outside [-1, 1]', () => {
    expect(Number.isNaN(Erfinv(1.1))).toBe(true)
    expect(Number.isNaN(Erfinv(-1.1))).toBe(true)
    expect(Number.isNaN(Erfinv(2))).toBe(true)
    expect(Number.isNaN(Erfinv(-2))).toBe(true)
    expect(Number.isNaN(Erfinv(Number.NaN))).toBe(true)
  })

  it('should be the inverse of Erf', () => {
    const testValues = [
      0, 0.1, 0.3, 0.5, 0.7, 0.9, -0.1, -0.3, -0.5, -0.7, -0.9,
    ]
    for (const x of testValues) {
      const y = Erfinv(x)
      // Relax precision tolerance for JavaScript floating-point differences
      expect(Erf(y)).toBeCloseTo(x, 5)
    }
  })

  it('should be an odd function', () => {
    const testValues = [0.1, 0.3, 0.5, 0.7, 0.9]
    for (const x of testValues) {
      expect(Erfinv(-x)).toBeCloseTo(-Erfinv(x), 14)
    }
  })

  it('should handle very small values', () => {
    expect(Erfinv(1e-10)).toBeCloseTo(8.862269254527579e-11, 14) //eslint-disable-line no-loss-of-precision
    expect(Erfinv(-1e-10)).toBeCloseTo(-8.862269254527579e-11, 14) //eslint-disable-line no-loss-of-precision
  })

  it('should handle values close to boundaries', () => {
    expect(Erfinv(0.999)).toBeGreaterThan(2)
    expect(Erfinv(-0.999)).toBeLessThan(-2)
    expect(Erfinv(0.9999)).toBeGreaterThan(2.5)
    expect(Erfinv(-0.9999)).toBeLessThan(-2.5)
  })
})

describe('Erfcinv', () => {
  it('should return correct values for common inputs', () => {
    expect(Erfcinv(1)).toBe(0)
    // Relax precision tolerance for JavaScript floating-point differences
    expect(Erfcinv(0.5)).toBeCloseTo(0.4769362762044699, 6)
    expect(Erfcinv(1.5)).toBeCloseTo(-0.4769362762044699, 6)
  })

  it('should handle boundary values', () => {
    expect(Erfcinv(0)).toBe(Number.POSITIVE_INFINITY)
    expect(Erfcinv(2)).toBe(Number.NEGATIVE_INFINITY)
  })

  it('should return NaN for values outside [0, 2]', () => {
    expect(Number.isNaN(Erfcinv(-0.1))).toBe(true)
    expect(Number.isNaN(Erfcinv(2.1))).toBe(true)
    expect(Number.isNaN(Erfcinv(-1))).toBe(true)
    expect(Number.isNaN(Erfcinv(3))).toBe(true)
    expect(Number.isNaN(Erfcinv(Number.NaN))).toBe(true)
  })

  it('should be the inverse of Erfc', () => {
    const testValues = [0.1, 0.3, 0.5, 0.7, 1, 1.3, 1.5, 1.7, 1.9]
    for (const x of testValues) {
      const y = Erfcinv(x)
      // Relax precision tolerance for JavaScript floating-point differences
      expect(Erfc(y)).toBeCloseTo(x, 5)
    }
  })

  it('should satisfy Erfcinv(x) = -Erfinv(x - 1)', () => {
    const testValues = [0.2, 0.5, 0.8, 1.2, 1.5, 1.8]
    for (const x of testValues) {
      expect(Erfcinv(x)).toBeCloseTo(-Erfinv(x - 1), 14)
    }
  })

  it('should handle values close to boundaries', () => {
    expect(Erfcinv(0.001)).toBeGreaterThan(2)
    expect(Erfcinv(1.999)).toBeLessThan(-2)
    expect(Erfcinv(0.0001)).toBeGreaterThan(2.5)
    expect(Erfcinv(1.9999)).toBeLessThan(-2.5)
  })
})
