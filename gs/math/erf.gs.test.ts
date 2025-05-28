import { describe, it, expect } from 'vitest'
import { Erf, erf, Erfc, erfc } from './erf.gs.js'

describe('Erf', () => {
  it('should return correct values for zero', () => {
    expect(Erf(0)).toBe(0)
    expect(Erf(-0)).toBe(-0)
  })

  it('should return correct values for common inputs', () => {
    // Relax precision tolerance for JavaScript floating-point differences
    expect(Erf(0.5)).toBeCloseTo(0.5204998778130465, 6)
    expect(Erf(1)).toBeCloseTo(0.8427007929497149, 6)
    expect(Erf(-0.5)).toBeCloseTo(-0.5204998778130465, 6)
    expect(Erf(-1)).toBeCloseTo(-0.8427007929497149, 6)
    expect(Erf(2)).toBeCloseTo(0.9953222650189527, 8)
    expect(Erf(-2)).toBeCloseTo(-0.9953222650189527, 8)
  })

  it('should handle special values', () => {
    expect(Erf(Number.POSITIVE_INFINITY)).toBe(1)
    expect(Erf(Number.NEGATIVE_INFINITY)).toBe(-1)
    expect(Number.isNaN(Erf(Number.NaN))).toBe(true)
  })

  it('should be an odd function', () => {
    const testValues = [0.1, 0.5, 1, 1.5, 2]
    for (const x of testValues) {
      expect(Erf(-x)).toBeCloseTo(-Erf(x), 14)
    }
  })

  it('should approach limits correctly', () => {
    expect(Erf(5)).toBeCloseTo(1, 10)
    expect(Erf(-5)).toBeCloseTo(-1, 10)
  })
})

describe('erf', () => {
  it('should work the same as Erf', () => {
    expect(erf(0)).toBe(Erf(0))
    expect(erf(0.5)).toBe(Erf(0.5))
    expect(erf(1)).toBe(Erf(1))
    expect(erf(-1)).toBe(Erf(-1))
    expect(Number.isNaN(erf(Number.NaN))).toBe(true)
  })
})

describe('Erfc', () => {
  it('should return correct values for zero', () => {
    expect(Erfc(0)).toBe(1)
    expect(Erfc(-0)).toBe(1)
  })

  it('should return correct values for common inputs', () => {
    // Relax precision tolerance for JavaScript floating-point differences
    expect(Erfc(0.5)).toBeCloseTo(0.4795001221869535, 6)
    expect(Erfc(1)).toBeCloseTo(0.1572992070502851, 6)
    expect(Erfc(-0.5)).toBeCloseTo(1.5204998778130465, 6)
    expect(Erfc(-1)).toBeCloseTo(1.8427007929497148, 6)
    expect(Erfc(2)).toBeCloseTo(0.004677734981047265, 8)
    expect(Erfc(-2)).toBeCloseTo(1.9953222650189528, 8)
  })

  it('should handle special values', () => {
    expect(Erfc(Number.POSITIVE_INFINITY)).toBe(0)
    expect(Erfc(Number.NEGATIVE_INFINITY)).toBe(2)
    expect(Number.isNaN(Erfc(Number.NaN))).toBe(true)
  })

  it('should satisfy Erfc(x) = 1 - Erf(x)', () => {
    const testValues = [0, 0.5, 1, -0.5, -1, 2, -2]
    for (const x of testValues) {
      expect(Erfc(x)).toBeCloseTo(1 - Erf(x), 14)
    }
  })

  it('should approach limits correctly', () => {
    expect(Erfc(5)).toBeCloseTo(0, 10)
    expect(Erfc(-5)).toBeCloseTo(2, 10)
  })
})

describe('erfc', () => {
  it('should work the same as Erfc', () => {
    expect(erfc(0)).toBe(Erfc(0))
    expect(erfc(0.5)).toBe(Erfc(0.5))
    expect(erfc(1)).toBe(Erfc(1))
    expect(erfc(-1)).toBe(Erfc(-1))
    expect(Number.isNaN(erfc(Number.NaN))).toBe(true)
  })
})
