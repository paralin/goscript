import { describe, it, expect } from 'vitest'
import { J1, Y1 } from './j1.gs.js'

describe('J1', () => {
  it('should return correct values for zero and small inputs', () => {
    expect(J1(0)).toBe(0)
    expect(J1(1)).toBeCloseTo(0.4400505857449335, 7)
    expect(J1(2)).toBeCloseTo(0.5767248077568733, 5)
  })

  it('should return correct values for various inputs', () => {
    expect(J1(3)).toBeCloseTo(0.33905895852593637, 5)
    expect(J1(5)).toBeCloseTo(-0.32757913759146523, 5)
    expect(J1(10)).toBeCloseTo(0.043472746168861424, 6)
  })

  it('should be an odd function', () => {
    const testValues = [1, 2, 3, 5, 10]
    for (const x of testValues) {
      expect(J1(-x)).toBeCloseTo(-J1(x), 14)
    }
  })

  it('should handle special values', () => {
    expect(J1(Number.POSITIVE_INFINITY)).toBe(0)
    expect(J1(Number.NEGATIVE_INFINITY)).toBe(0)
    expect(Number.isNaN(J1(Number.NaN))).toBe(true)
  })

  it('should oscillate for large values', () => {
    // J1 should oscillate around 0 for large x
    const largeValues = [20, 30, 50, 100]
    for (const x of largeValues) {
      expect(Math.abs(J1(x))).toBeLessThan(0.5)
    }
  })

  it('should approach x/2 for small x', () => {
    const smallValues = [0.01, 0.001, 0.0001]
    for (const x of smallValues) {
      expect(J1(x)).toBeCloseTo(x / 2, 6)
    }
  })
})

describe('Y1', () => {
  it('should return correct values for positive inputs', () => {
    expect(Y1(1)).toBeCloseTo(-0.7812128213002887, 6)
    expect(Y1(2)).toBeCloseTo(-0.10703243154093754, 6)
    expect(Y1(5)).toBeCloseTo(0.1478631433912268, 6)
  })

  it('should approach negative infinity as x approaches 0 from positive side', () => {
    expect(Y1(0.001)).toBeLessThan(-300)
    expect(Y1(0.0001)).toBeLessThan(-3000)
  })

  it('should handle special values', () => {
    expect(Y1(Number.POSITIVE_INFINITY)).toBe(0)
    // Check if Y1(0) returns a very large negative number or -Infinity
    const y1_zero = Y1(0)
    expect(
      y1_zero < -1e10 ||
        y1_zero === Number.NEGATIVE_INFINITY ||
        Number.isNaN(y1_zero),
    ).toBe(true)
    expect(Number.isNaN(Y1(-1))).toBe(true)
    expect(Number.isNaN(Y1(Number.NEGATIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Y1(Number.NaN))).toBe(true)
  })

  it('should oscillate for large values', () => {
    // Y1 should oscillate around 0 for large x
    const largeValues = [20, 30, 50, 100]
    for (const x of largeValues) {
      expect(Math.abs(Y1(x))).toBeLessThan(0.5)
    }
  })

  it('should be undefined for negative values', () => {
    expect(Number.isNaN(Y1(-1))).toBe(true)
    expect(Number.isNaN(Y1(-5))).toBe(true)
    expect(Number.isNaN(Y1(-10))).toBe(true)
  })
})
