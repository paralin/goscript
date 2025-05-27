import { describe, it, expect } from 'vitest'
import { Inf, NaN as MathNaN, IsNaN, IsInf, normalize } from './bits.gs.js'

describe('Inf', () => {
  it('should return positive infinity for positive sign', () => {
    expect(Inf(1)).toBe(Number.POSITIVE_INFINITY)
    expect(Inf(100)).toBe(Number.POSITIVE_INFINITY)
  })

  it('should return negative infinity for negative sign', () => {
    expect(Inf(-1)).toBe(Number.NEGATIVE_INFINITY)
    expect(Inf(-100)).toBe(Number.NEGATIVE_INFINITY)
  })

  it('should return positive infinity for zero sign', () => {
    expect(Inf(0)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('NaN', () => {
  it('should return NaN', () => {
    expect(Number.isNaN(MathNaN())).toBe(true)
  })
})

describe('IsNaN', () => {
  it('should identify NaN correctly', () => {
    expect(IsNaN(Number.NaN)).toBe(true)
    expect(IsNaN(MathNaN())).toBe(true)
  })

  it('should return false for non-NaN values', () => {
    expect(IsNaN(0)).toBe(false)
    expect(IsNaN(1)).toBe(false)
    expect(IsNaN(-1)).toBe(false)
    expect(IsNaN(Number.POSITIVE_INFINITY)).toBe(false)
    expect(IsNaN(Number.NEGATIVE_INFINITY)).toBe(false)
  })
})

describe('IsInf', () => {
  it('should identify positive infinity when sign > 0', () => {
    expect(IsInf(Number.POSITIVE_INFINITY, 1)).toBe(true)
    expect(IsInf(Number.NEGATIVE_INFINITY, 1)).toBe(false)
    expect(IsInf(1, 1)).toBe(false)
  })

  it('should identify negative infinity when sign < 0', () => {
    expect(IsInf(Number.NEGATIVE_INFINITY, -1)).toBe(true)
    expect(IsInf(Number.POSITIVE_INFINITY, -1)).toBe(false)
    expect(IsInf(-1, -1)).toBe(false)
  })

  it('should identify any infinity when sign == 0', () => {
    expect(IsInf(Number.POSITIVE_INFINITY, 0)).toBe(true)
    expect(IsInf(Number.NEGATIVE_INFINITY, 0)).toBe(true)
    expect(IsInf(1, 0)).toBe(false)
    expect(IsInf(Number.NaN, 0)).toBe(false)
  })
})

describe('normalize', () => {
  it('should return input for normal numbers', () => {
    const [y, exp] = normalize(1.5)
    expect(y).toBe(1.5)
    expect(exp).toBe(0)
  })

  it('should normalize subnormal numbers', () => {
    const smallValue = 1e-320 // A subnormal number
    const [y, exp] = normalize(smallValue)
    expect(Math.abs(y)).toBeCloseTo(smallValue * Math.pow(2, 52), 10)
    expect(exp).toBe(-52)
    expect(y * Math.pow(2, exp)).toBeCloseTo(smallValue, 300)
  })

  it('should handle negative values', () => {
    const [y, exp] = normalize(-1.5)
    expect(y).toBe(-1.5)
    expect(exp).toBe(0)
  })

  it('should handle zero', () => {
    const [y, exp] = normalize(0)
    expect(y).toBe(0)
    expect(exp).toBe(-52)
  })
}) 