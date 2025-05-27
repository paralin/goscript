import { describe, it, expect } from 'vitest'
import { Remainder, remainder } from './remainder.gs.js'

describe('Remainder', () => {
  it('should return correct IEEE 754 remainder for normal values', () => {
    expect(Remainder(5, 3)).toBeCloseTo(-1, 15)
    expect(Remainder(7, 3)).toBeCloseTo(1, 15)
    expect(Remainder(8, 3)).toBeCloseTo(-1, 15)
    expect(Remainder(9, 3)).toBeCloseTo(0, 15)
    expect(Remainder(10, 3)).toBeCloseTo(1, 15)
  })

  it('should handle negative values correctly', () => {
    expect(Remainder(-5, 3)).toBeCloseTo(1, 15)
    expect(Remainder(5, -3)).toBeCloseTo(-1, 15)
    expect(Remainder(-5, -3)).toBeCloseTo(1, 15)
  })

  it('should handle fractional values', () => {
    expect(Remainder(5.5, 2)).toBeCloseTo(-0.5, 15)
    expect(Remainder(7.5, 2)).toBeCloseTo(-0.5, 15)
    expect(Remainder(6.5, 2)).toBeCloseTo(0.5, 15)
    expect(Remainder(8.5, 2)).toBeCloseTo(0.5, 15)
  })

  it('should return zero when x is a multiple of y', () => {
    expect(Remainder(6, 3)).toBe(0)
    expect(Remainder(12, 4)).toBe(0)
    expect(Remainder(-8, 2)).toBe(0)
    expect(Remainder(15, 5)).toBe(0)
  })

  it('should handle special cases with NaN', () => {
    expect(Number.isNaN(Remainder(Number.NaN, 3))).toBe(true)
    expect(Number.isNaN(Remainder(5, Number.NaN))).toBe(true)
    expect(Number.isNaN(Remainder(Number.NaN, Number.NaN))).toBe(true)
  })

  it('should handle special cases with infinity', () => {
    expect(Number.isNaN(Remainder(Number.POSITIVE_INFINITY, 3))).toBe(true)
    expect(Number.isNaN(Remainder(Number.NEGATIVE_INFINITY, 3))).toBe(true)
    expect(Remainder(5, Number.POSITIVE_INFINITY)).toBe(5)
    expect(Remainder(5, Number.NEGATIVE_INFINITY)).toBe(5)
    expect(Remainder(-7, Number.POSITIVE_INFINITY)).toBe(-7)
  })

  it('should handle division by zero', () => {
    expect(Number.isNaN(Remainder(5, 0))).toBe(true)
    expect(Number.isNaN(Remainder(-5, 0))).toBe(true)
    expect(Number.isNaN(Remainder(0, 0))).toBe(true)
  })

  it('should handle zero dividend', () => {
    expect(Remainder(0, 3)).toBe(0)
    expect(Remainder(0, -3)).toBe(0)
    const result = Remainder(-0, 3)
    expect(result === 0 || Object.is(result, -0)).toBe(true)
  })
})

describe('remainder', () => {
  it('should work the same as Remainder', () => {
    expect(remainder(5, 3)).toBe(Remainder(5, 3))
    expect(remainder(7, 3)).toBe(Remainder(7, 3))
    expect(remainder(-5, 3)).toBe(Remainder(-5, 3))
    expect(remainder(5.5, 2)).toBe(Remainder(5.5, 2))
    expect(Number.isNaN(remainder(Number.NaN, 3))).toBe(true)
    expect(Number.isNaN(remainder(5, 0))).toBe(true)
  })
}) 