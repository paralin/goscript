import { describe, it, expect } from 'vitest'
import { Atanh, atanh } from './atanh.gs.js'

describe('Atanh', () => {
  it('should return correct inverse hyperbolic tangent values', () => {
    expect(Atanh(0)).toBe(0)
    expect(Atanh(-0)).toBe(-0)
    expect(Atanh(0.5)).toBeCloseTo(0.5493061443340549, 15)
    expect(Atanh(-0.5)).toBeCloseTo(-0.5493061443340549, 15)
    expect(Atanh(0.9)).toBeCloseTo(1.4722194895832204, 15)
    expect(Atanh(-0.9)).toBeCloseTo(-1.4722194895832204, 15)
  })

  it('should return infinity for boundary values', () => {
    expect(Atanh(1)).toBe(Number.POSITIVE_INFINITY)
    expect(Atanh(-1)).toBe(Number.NEGATIVE_INFINITY)
  })

  it('should return NaN for values outside [-1, 1]', () => {
    expect(Number.isNaN(Atanh(1.1))).toBe(true)
    expect(Number.isNaN(Atanh(-1.1))).toBe(true)
    expect(Number.isNaN(Atanh(2))).toBe(true)
    expect(Number.isNaN(Atanh(-2))).toBe(true)
  })

  it('should handle special values', () => {
    expect(Number.isNaN(Atanh(Number.POSITIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Atanh(Number.NEGATIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Atanh(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Number.isNaN(Atanh(Number.MAX_VALUE))).toBe(true)
    expect(Number.isNaN(Atanh(-Number.MAX_VALUE))).toBe(true)
    expect(Atanh(Number.MIN_VALUE)).toBeCloseTo(Number.MIN_VALUE, 15)
  })
})

describe('atanh', () => {
  it('should work the same as Atanh', () => {
    expect(atanh(0)).toBe(Atanh(0))
    expect(atanh(0.5)).toBe(Atanh(0.5))
    expect(atanh(-0.5)).toBe(Atanh(-0.5))
    expect(atanh(1)).toBe(Atanh(1))
    expect(atanh(-1)).toBe(Atanh(-1))
  })
}) 