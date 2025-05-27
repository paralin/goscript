import { describe, it, expect } from 'vitest'
import { Logb, Ilogb, ilogb } from './logb.gs.js'

describe('Logb', () => {
  it('should return correct binary exponent for powers of 2', () => {
    expect(Logb(1)).toBe(0)
    expect(Logb(2)).toBe(1)
    expect(Logb(4)).toBe(2)
    expect(Logb(8)).toBe(3)
    expect(Logb(16)).toBe(4)
    expect(Logb(0.5)).toBe(-1)
    expect(Logb(0.25)).toBe(-2)
    expect(Logb(0.125)).toBe(-3)
  })

  it('should return correct binary exponent for other values', () => {
    expect(Logb(3)).toBe(1)
    expect(Logb(5)).toBe(2)
    expect(Logb(7)).toBe(2)
    expect(Logb(15)).toBe(3)
    expect(Logb(0.3)).toBe(-2)
    expect(Logb(0.7)).toBe(-1)
  })

  it('should handle negative values', () => {
    expect(Logb(-1)).toBe(0)
    expect(Logb(-2)).toBe(1)
    expect(Logb(-4)).toBe(2)
    expect(Logb(-0.5)).toBe(-1)
  })

  it('should handle special values', () => {
    expect(Logb(0)).toBe(Number.NEGATIVE_INFINITY)
    expect(Logb(-0)).toBe(Number.NEGATIVE_INFINITY)
    expect(Logb(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Logb(Number.NEGATIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Logb(Number.NaN)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('Ilogb', () => {
  it('should return correct integer binary exponent for powers of 2', () => {
    expect(Ilogb(1)).toBe(0)
    expect(Ilogb(2)).toBe(1)
    expect(Ilogb(4)).toBe(2)
    expect(Ilogb(8)).toBe(3)
    expect(Ilogb(16)).toBe(4)
    expect(Ilogb(0.5)).toBe(-1)
    expect(Ilogb(0.25)).toBe(-2)
    expect(Ilogb(0.125)).toBe(-3)
  })

  it('should return correct integer binary exponent for other values', () => {
    expect(Ilogb(3)).toBe(1)
    expect(Ilogb(5)).toBe(2)
    expect(Ilogb(7)).toBe(2)
    expect(Ilogb(15)).toBe(3)
    expect(Ilogb(0.3)).toBe(-2)
    expect(Ilogb(0.7)).toBe(-1)
  })

  it('should handle negative values', () => {
    expect(Ilogb(-1)).toBe(0)
    expect(Ilogb(-2)).toBe(1)
    expect(Ilogb(-4)).toBe(2)
    expect(Ilogb(-0.5)).toBe(-1)
  })

  it('should handle special values', () => {
    expect(Ilogb(0)).toBe(-2147483648) // MinInt32
    expect(Ilogb(-0)).toBe(-2147483648) // MinInt32
    expect(Ilogb(Number.POSITIVE_INFINITY)).toBe(2147483647) // MaxInt32
    expect(Ilogb(Number.NEGATIVE_INFINITY)).toBe(2147483647) // MaxInt32
    expect(Ilogb(Number.NaN)).toBe(2147483647) // MaxInt32
  })
})

describe('ilogb', () => {
  it('should work the same as Ilogb for finite non-zero values', () => {
    expect(ilogb(1)).toBe(0)
    expect(ilogb(2)).toBe(1)
    expect(ilogb(4)).toBe(2)
    expect(ilogb(0.5)).toBe(-1)
    expect(ilogb(3)).toBe(1)
    expect(ilogb(-2)).toBe(1)
  })
}) 