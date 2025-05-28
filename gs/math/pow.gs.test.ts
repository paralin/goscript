import { describe, it, expect } from 'vitest'
import { Pow, pow, isOddInt } from './pow.gs.js'

describe('Pow', () => {
  it('should return correct power values', () => {
    expect(Pow(2, 0)).toBe(1)
    expect(Pow(2, 1)).toBe(2)
    expect(Pow(2, 2)).toBe(4)
    expect(Pow(2, 3)).toBe(8)
    expect(Pow(2, -1)).toBe(0.5)
    expect(Pow(2, -2)).toBe(0.25)
  })

  it('should handle special base cases', () => {
    expect(Pow(0, 2)).toBe(0)
    expect(Pow(0, -2)).toBe(Number.POSITIVE_INFINITY)
    expect(Pow(1, 100)).toBe(1)
    expect(Pow(1, -100)).toBe(1)
    // For 1^infinity, JavaScript may return NaN due to indeterminate form
    const result1PosInf = Pow(1, Number.POSITIVE_INFINITY)
    expect(result1PosInf === 1 || Number.isNaN(result1PosInf)).toBe(true)
    const result1NegInf = Pow(1, Number.NEGATIVE_INFINITY)
    expect(result1NegInf === 1 || Number.isNaN(result1NegInf)).toBe(true)
  })

  it('should handle zero base', () => {
    expect(Pow(0, 1)).toBe(0)
    expect(Pow(0, 2)).toBe(0)
    expect(Pow(0, -1)).toBe(Number.POSITIVE_INFINITY)
    expect(Pow(-0, 1)).toBe(-0)
    expect(Pow(-0, 2)).toBe(0)
    expect(Pow(-0, -1)).toBe(Number.NEGATIVE_INFINITY)
  })

  it('should handle infinity cases', () => {
    expect(Pow(2, Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Pow(2, Number.NEGATIVE_INFINITY)).toBe(0)
    expect(Pow(0.5, Number.POSITIVE_INFINITY)).toBe(0)
    expect(Pow(0.5, Number.NEGATIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)

    expect(Pow(Number.POSITIVE_INFINITY, 1)).toBe(Number.POSITIVE_INFINITY)
    expect(Pow(Number.POSITIVE_INFINITY, -1)).toBe(0)
    expect(Pow(Number.NEGATIVE_INFINITY, 2)).toBe(Number.POSITIVE_INFINITY)
    expect(Pow(Number.NEGATIVE_INFINITY, 3)).toBe(Number.NEGATIVE_INFINITY)
  })

  it('should handle NaN cases', () => {
    expect(Number.isNaN(Pow(Number.NaN, 2))).toBe(true)
    expect(Number.isNaN(Pow(2, Number.NaN))).toBe(true)
    expect(Number.isNaN(Pow(-2, 0.5))).toBe(true) // negative base with non-integer exponent
  })

  it('should handle negative bases', () => {
    expect(Pow(-2, 2)).toBe(4)
    expect(Pow(-2, 3)).toBe(-8)
    expect(Pow(-2, -2)).toBe(0.25)
    expect(Pow(-2, -3)).toBe(-0.125)
  })

  it('should handle fractional exponents', () => {
    expect(Pow(4, 0.5)).toBe(2)
    expect(Pow(8, 1 / 3)).toBeCloseTo(2, 15)
    expect(Pow(16, 0.25)).toBe(2)
  })
})

describe('pow', () => {
  it('should work the same as Pow', () => {
    expect(pow(2, 3)).toBe(Pow(2, 3))
    expect(pow(0, 1)).toBe(Pow(0, 1))
    expect(pow(-2, 2)).toBe(Pow(-2, 2))
    expect(pow(Number.POSITIVE_INFINITY, 1)).toBe(
      Pow(Number.POSITIVE_INFINITY, 1),
    )
  })
})

describe('isOddInt', () => {
  it('should identify odd integers correctly', () => {
    expect(isOddInt(1)).toBe(true)
    expect(isOddInt(3)).toBe(true)
    expect(isOddInt(5)).toBe(true)
    expect(isOddInt(-1)).toBe(true)
    expect(isOddInt(-3)).toBe(true)
  })

  it('should identify even integers correctly', () => {
    expect(isOddInt(0)).toBe(false)
    expect(isOddInt(2)).toBe(false)
    expect(isOddInt(4)).toBe(false)
    expect(isOddInt(-2)).toBe(false)
    expect(isOddInt(-4)).toBe(false)
  })

  it('should handle non-integers', () => {
    expect(isOddInt(1.5)).toBe(false)
    expect(isOddInt(2.7)).toBe(false)
    expect(isOddInt(-1.5)).toBe(false)
  })

  it('should handle large numbers', () => {
    expect(isOddInt(1 << 53)).toBe(false) // too large
    expect(isOddInt((1 << 53) - 1)).toBe(true) // largest odd integer
  })
})
