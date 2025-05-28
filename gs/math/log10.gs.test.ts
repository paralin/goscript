import { describe, it, expect } from 'vitest'
import { Log10, log10, Log2, log2 } from './log10.gs.js'

describe('Log10', () => {
  it('should return correct base-10 logarithm values', () => {
    expect(Log10(1)).toBe(0)
    expect(Log10(10)).toBe(1)
    expect(Log10(100)).toBe(2)
    expect(Log10(1000)).toBe(3)
    expect(Log10(0.1)).toBe(-1)
    expect(Log10(0.01)).toBe(-2)
  })

  it('should handle special values', () => {
    expect(Log10(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Log10(0)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Log10(-1))).toBe(true)
    expect(Number.isNaN(Log10(-10))).toBe(true)
    expect(Number.isNaN(Log10(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Log10(Number.MAX_VALUE)).toBeCloseTo(308.2547155599167, 10)
    expect(Log10(Number.MIN_VALUE)).toBeCloseTo(-323.3062153431158, 10)
    expect(Number.isNaN(Log10(Number.NEGATIVE_INFINITY))).toBe(true)
  })

  it('should handle fractional values', () => {
    expect(Log10(Math.sqrt(10))).toBeCloseTo(0.5, 15)
    expect(Log10(Math.pow(10, 0.5))).toBeCloseTo(0.5, 15)
  })
})

describe('log10', () => {
  it('should work the same as Log10', () => {
    expect(log10(1)).toBe(Log10(1))
    expect(log10(10)).toBe(Log10(10))
    expect(log10(100)).toBe(Log10(100))
    expect(Number.isNaN(log10(-1))).toBe(Number.isNaN(Log10(-1)))
  })
})

describe('Log2', () => {
  it('should return correct base-2 logarithm values', () => {
    expect(Log2(1)).toBe(0)
    expect(Log2(2)).toBe(1)
    expect(Log2(4)).toBe(2)
    expect(Log2(8)).toBe(3)
    expect(Log2(0.5)).toBe(-1)
    expect(Log2(0.25)).toBe(-2)
  })

  it('should handle special values', () => {
    expect(Log2(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Log2(0)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Log2(-1))).toBe(true)
    expect(Number.isNaN(Log2(-10))).toBe(true)
    expect(Number.isNaN(Log2(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Log2(Number.MAX_VALUE)).toBeCloseTo(1024, 10)
    expect(Log2(Number.MIN_VALUE)).toBeCloseTo(-1074, 10)
    expect(Number.isNaN(Log2(Number.NEGATIVE_INFINITY))).toBe(true)
  })

  it('should handle fractional values', () => {
    expect(Log2(Math.sqrt(2))).toBeCloseTo(0.5, 15)
    expect(Log2(Math.pow(2, 0.5))).toBeCloseTo(0.5, 15)
  })
})

describe('log2', () => {
  it('should work the same as Log2', () => {
    expect(log2(1)).toBe(Log2(1))
    expect(log2(2)).toBe(Log2(2))
    expect(log2(4)).toBe(Log2(4))
    expect(Number.isNaN(log2(-1))).toBe(Number.isNaN(Log2(-1)))
  })
})
