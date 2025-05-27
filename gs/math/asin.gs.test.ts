import { describe, it, expect } from 'vitest'
import { Asin, asin, Acos, acos } from './asin.gs.js'

describe('Asin', () => {
  it('should return correct arcsine values', () => {
    expect(Asin(0)).toBe(0)
    expect(Asin(1)).toBeCloseTo(1.5707963267948966, 15)
    expect(Asin(-1)).toBeCloseTo(-1.5707963267948966, 15)
    expect(Asin(0.5)).toBeCloseTo(0.5235987755982988, 15)
    expect(Asin(-0.5)).toBeCloseTo(-0.5235987755982988, 15)
  })

  it('should return NaN for values outside [-1, 1]', () => {
    expect(Number.isNaN(Asin(1.1))).toBe(true)
    expect(Number.isNaN(Asin(-1.1))).toBe(true)
    expect(Number.isNaN(Asin(2))).toBe(true)
    expect(Number.isNaN(Asin(-2))).toBe(true)
  })

  it('should handle special values', () => {
    expect(Number.isNaN(Asin(Number.NaN))).toBe(true)
    expect(Number.isNaN(Asin(Number.POSITIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Asin(Number.NEGATIVE_INFINITY))).toBe(true)
  })
})

describe('asin', () => {
  it('should work the same as Asin', () => {
    expect(asin(0)).toBe(Asin(0))
    expect(asin(1)).toBe(Asin(1))
    expect(asin(-1)).toBe(Asin(-1))
    expect(asin(0.5)).toBe(Asin(0.5))
  })
})

describe('Acos', () => {
  it('should return correct arccosine values', () => {
    expect(Acos(1)).toBe(0)
    expect(Acos(0)).toBeCloseTo(1.5707963267948966, 15)
    expect(Acos(-1)).toBeCloseTo(3.141592653589793, 15)
    expect(Acos(0.5)).toBeCloseTo(1.0471975511965976, 15)
    expect(Acos(-0.5)).toBeCloseTo(2.0943951023931953, 15)
  })

  it('should return NaN for values outside [-1, 1]', () => {
    expect(Number.isNaN(Acos(1.1))).toBe(true)
    expect(Number.isNaN(Acos(-1.1))).toBe(true)
    expect(Number.isNaN(Acos(2))).toBe(true)
    expect(Number.isNaN(Acos(-2))).toBe(true)
  })

  it('should handle special values', () => {
    expect(Number.isNaN(Acos(Number.NaN))).toBe(true)
    expect(Number.isNaN(Acos(Number.POSITIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Acos(Number.NEGATIVE_INFINITY))).toBe(true)
  })
})

describe('acos', () => {
  it('should work the same as Acos', () => {
    expect(acos(0)).toBe(Acos(0))
    expect(acos(1)).toBe(Acos(1))
    expect(acos(-1)).toBe(Acos(-1))
    expect(acos(0.5)).toBe(Acos(0.5))
  })
}) 