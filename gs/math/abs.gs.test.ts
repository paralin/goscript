import { describe, it, expect } from 'vitest'
import { Abs } from './abs.gs.js'

describe('Abs', () => {
  it('should return absolute value of positive numbers', () => {
    expect(Abs(5)).toBe(5)
    expect(Abs(3.14)).toBe(3.14)
    expect(Abs(0)).toBe(0)
  })

  it('should return absolute value of negative numbers', () => {
    expect(Abs(-5)).toBe(5)
    expect(Abs(-3.14)).toBe(3.14)
    expect(Abs(-0)).toBe(0)
  })

  it('should handle special values', () => {
    expect(Abs(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Abs(Number.NEGATIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isNaN(Abs(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Abs(Number.MAX_VALUE)).toBe(Number.MAX_VALUE)
    expect(Abs(-Number.MAX_VALUE)).toBe(Number.MAX_VALUE)
    expect(Abs(Number.MIN_VALUE)).toBe(Number.MIN_VALUE)
    expect(Abs(-Number.MIN_VALUE)).toBe(Number.MIN_VALUE)
  })
}) 