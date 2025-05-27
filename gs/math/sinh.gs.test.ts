import { describe, it, expect } from 'vitest'
import { Sinh, sinh, Cosh, cosh } from './sinh.gs.js'

describe('Sinh', () => {
  it('should return correct hyperbolic sine values', () => {
    expect(Sinh(0)).toBe(0)
    expect(Sinh(-0)).toBe(-0)
    expect(Sinh(1)).toBeCloseTo(1.1752011936438014, 15)
    expect(Sinh(-1)).toBeCloseTo(-1.1752011936438014, 15)
    expect(Sinh(2)).toBeCloseTo(3.626860407847019, 15)
    expect(Sinh(-2)).toBeCloseTo(-3.626860407847019, 15)
  })

  it('should handle special values', () => {
    expect(Sinh(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Sinh(Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Sinh(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Sinh(Number.MAX_VALUE)).toBe(Number.POSITIVE_INFINITY)
    expect(Sinh(-Number.MAX_VALUE)).toBe(Number.NEGATIVE_INFINITY)
    expect(Sinh(Number.MIN_VALUE)).toBeCloseTo(Number.MIN_VALUE, 15)
  })
})

describe('sinh', () => {
  it('should work the same as Sinh', () => {
    expect(sinh(0)).toBe(Sinh(0))
    expect(sinh(1)).toBe(Sinh(1))
    expect(sinh(-1)).toBe(Sinh(-1))
    expect(sinh(Number.POSITIVE_INFINITY)).toBe(Sinh(Number.POSITIVE_INFINITY))
  })
})

describe('Cosh', () => {
  it('should return correct hyperbolic cosine values', () => {
    expect(Cosh(0)).toBe(1)
    expect(Cosh(-0)).toBe(1)
    expect(Cosh(1)).toBeCloseTo(1.5430806348152437, 15)
    expect(Cosh(-1)).toBeCloseTo(1.5430806348152437, 15)
    expect(Cosh(2)).toBeCloseTo(3.7621956910836314, 15)
    expect(Cosh(-2)).toBeCloseTo(3.7621956910836314, 15)
  })

  it('should handle special values', () => {
    expect(Cosh(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Cosh(Number.NEGATIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isNaN(Cosh(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Cosh(Number.MAX_VALUE)).toBe(Number.POSITIVE_INFINITY)
    expect(Cosh(-Number.MAX_VALUE)).toBe(Number.POSITIVE_INFINITY)
    expect(Cosh(Number.MIN_VALUE)).toBeCloseTo(1, 15)
  })
})

describe('cosh', () => {
  it('should work the same as Cosh', () => {
    expect(cosh(0)).toBe(Cosh(0))
    expect(cosh(1)).toBe(Cosh(1))
    expect(cosh(-1)).toBe(Cosh(-1))
    expect(cosh(Number.POSITIVE_INFINITY)).toBe(Cosh(Number.POSITIVE_INFINITY))
  })
}) 