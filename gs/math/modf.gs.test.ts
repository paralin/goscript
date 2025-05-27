import { describe, it, expect } from 'vitest'
import { Modf, modf } from './modf.gs.js'

describe('Modf', () => {
  it('should return integer and fractional parts for positive numbers', () => {
    const [int, frac] = Modf(3.14)
    expect(int).toBe(3)
    expect(frac).toBeCloseTo(0.14, 14)
  })

  it('should return integer and fractional parts for negative numbers', () => {
    const [int, frac] = Modf(-3.14)
    expect(int).toBe(-3)
    expect(frac).toBeCloseTo(-0.14, 14)
  })

  it('should handle zero correctly', () => {
    const [int, frac] = Modf(0)
    expect(int).toBe(0)
    expect(frac).toBe(0)
    
    const [intNeg, fracNeg] = Modf(-0)
    expect(Object.is(intNeg, -0)).toBe(true)
    expect(fracNeg === 0 || Object.is(fracNeg, -0)).toBe(true)
  })

  it('should handle integer values', () => {
    const [int, frac] = Modf(5)
    expect(int).toBe(5)
    expect(frac).toBe(0)
    
    const [intNeg, fracNeg] = Modf(-5)
    expect(intNeg).toBe(-5)
    expect(fracNeg === 0 || Object.is(fracNeg, -0)).toBe(true)
  })

  it('should handle special values', () => {
    const [intPosInf, fracPosInf] = Modf(Number.POSITIVE_INFINITY)
    expect(intPosInf).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isNaN(fracPosInf)).toBe(true)
    
    const [intNegInf, fracNegInf] = Modf(Number.NEGATIVE_INFINITY)
    expect(intNegInf).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(fracNegInf)).toBe(true)
    
    const [intNaN, fracNaN] = Modf(Number.NaN)
    expect(Number.isNaN(intNaN)).toBe(true)
    expect(Number.isNaN(fracNaN)).toBe(true)
  })

  it('should preserve sign in both parts', () => {
    const [int1, frac1] = Modf(2.5)
    expect(Math.sign(int1)).toBe(1)
    expect(Math.sign(frac1)).toBe(1)
    
    const [int2, frac2] = Modf(-2.5)
    expect(Math.sign(int2)).toBe(-1)
    expect(Math.sign(frac2)).toBe(-1)
  })

  it('should handle very small fractional parts', () => {
    const [int, frac] = Modf(1.0000000000000002)
    expect(int).toBe(1)
    expect(frac).toBeCloseTo(2.220446049250313e-16, 30)
  })
})

describe('modf', () => {
  it('should work the same as Modf', () => {
    const [int1, frac1] = modf(3.14)
    const [int2, frac2] = Modf(3.14)
    expect(int1).toBe(int2)
    expect(frac1).toBe(frac2)
    
    const [int3, frac3] = modf(-3.14)
    const [int4, frac4] = Modf(-3.14)
    expect(int3).toBe(int4)
    expect(frac3).toBe(frac4)
  })
}) 