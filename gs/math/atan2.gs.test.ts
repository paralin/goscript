import { describe, it, expect } from 'vitest'
import { Atan2, atan2 } from './atan2.gs.js'

describe('Atan2', () => {
  it('should return correct arctangent values for basic cases', () => {
    expect(Atan2(1, 1)).toBeCloseTo(Math.PI / 4, 15)
    expect(Atan2(1, -1)).toBeCloseTo(3 * Math.PI / 4, 15)
    expect(Atan2(-1, 1)).toBeCloseTo(-Math.PI / 4, 15)
    expect(Atan2(-1, -1)).toBeCloseTo(-3 * Math.PI / 4, 15)
  })

  it('should handle zero cases correctly', () => {
    expect(Atan2(0, 1)).toBe(0)
    expect(Atan2(0, -1)).toBeCloseTo(Math.PI, 15)
    expect(Atan2(1, 0)).toBeCloseTo(Math.PI / 2, 15)
    expect(Atan2(-1, 0)).toBeCloseTo(-Math.PI / 2, 15)
  })

  it('should handle infinity cases', () => {
    expect(Atan2(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY)).toBeCloseTo(Math.PI / 4, 15)
    expect(Atan2(Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY)).toBeCloseTo(-Math.PI / 4, 15)
    expect(Atan2(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)).toBeCloseTo(3 * Math.PI / 4, 15)
    expect(Atan2(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY)).toBeCloseTo(-3 * Math.PI / 4, 15)
    
    expect(Atan2(1, Number.POSITIVE_INFINITY)).toBe(0)
    expect(Atan2(1, Number.NEGATIVE_INFINITY)).toBeCloseTo(Math.PI, 15)
    expect(Atan2(-1, Number.NEGATIVE_INFINITY)).toBeCloseTo(-Math.PI, 15)
    
    expect(Atan2(Number.POSITIVE_INFINITY, 1)).toBeCloseTo(Math.PI / 2, 15)
    expect(Atan2(Number.NEGATIVE_INFINITY, 1)).toBeCloseTo(-Math.PI / 2, 15)
  })

  it('should handle NaN cases', () => {
    expect(Number.isNaN(Atan2(Number.NaN, 1))).toBe(true)
    expect(Number.isNaN(Atan2(1, Number.NaN))).toBe(true)
    expect(Number.isNaN(Atan2(Number.NaN, Number.NaN))).toBe(true)
  })

  it('should handle signed zero correctly', () => {
    expect(Atan2(0, 1)).toBe(0)
    expect(Atan2(-0, 1)).toBe(-0)
    expect(Atan2(0, -1)).toBeCloseTo(Math.PI, 15)
    expect(Atan2(-0, -1)).toBeCloseTo(-Math.PI, 15)
  })
})

describe('atan2', () => {
  it('should work the same as Atan2', () => {
    expect(atan2(1, 1)).toBe(Atan2(1, 1))
    expect(atan2(1, -1)).toBe(Atan2(1, -1))
    expect(atan2(-1, 1)).toBe(Atan2(-1, 1))
    expect(atan2(-1, -1)).toBe(Atan2(-1, -1))
    expect(atan2(0, 1)).toBe(Atan2(0, 1))
  })
}) 