import { describe, it, expect } from 'vitest'
import { Copysign } from './copysign.gs.js'

describe('Copysign', () => {
  it('should return value with magnitude of f and sign of sign', () => {
    expect(Copysign(5, 1)).toBe(5)
    expect(Copysign(5, -1)).toBe(-5)
    expect(Copysign(-5, 1)).toBe(5)
    expect(Copysign(-5, -1)).toBe(-5)
  })

  it('should handle zero values correctly', () => {
    expect(Copysign(0, 1)).toBe(0)
    expect(Copysign(0, -1)).toBe(-0)
    expect(Copysign(-0, 1)).toBe(0)
    expect(Copysign(-0, -1)).toBe(-0)
  })

  it('should handle infinity values', () => {
    expect(Copysign(Number.POSITIVE_INFINITY, 1)).toBe(Number.POSITIVE_INFINITY)
    expect(Copysign(Number.POSITIVE_INFINITY, -1)).toBe(Number.NEGATIVE_INFINITY)
    expect(Copysign(Number.NEGATIVE_INFINITY, 1)).toBe(Number.POSITIVE_INFINITY)
    expect(Copysign(Number.NEGATIVE_INFINITY, -1)).toBe(Number.NEGATIVE_INFINITY)
  })

  it('should handle NaN values', () => {
    expect(Number.isNaN(Copysign(Number.NaN, 1))).toBe(true)
    expect(Number.isNaN(Copysign(Number.NaN, -1))).toBe(true)
    expect(Copysign(5, Number.NaN)).toBe(5) // NaN is positive
  })

  it('should handle fractional values', () => {
    expect(Copysign(3.14, 1)).toBe(3.14)
    expect(Copysign(3.14, -1)).toBe(-3.14)
    expect(Copysign(-3.14, 1)).toBe(3.14)
    expect(Copysign(-3.14, -1)).toBe(-3.14)
  })

  it('should handle edge cases with signed zero', () => {
    expect(Object.is(Copysign(5, -0), -5)).toBe(true)
    expect(Object.is(Copysign(-5, -0), -5)).toBe(true)
    expect(Object.is(Copysign(0, -0), -0)).toBe(true)
  })
}) 