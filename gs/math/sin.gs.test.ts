import { describe, it, expect } from 'vitest'
import { Sin, sin, Cos, cos } from './sin.gs.js'

describe('Sin', () => {
  it('should return correct sine values', () => {
    expect(Sin(0)).toBe(0)
    expect(Sin(-0)).toBe(-0)
    expect(Sin(Math.PI / 2)).toBeCloseTo(1, 15)
    expect(Sin(-Math.PI / 2)).toBeCloseTo(-1, 15)
    expect(Sin(Math.PI)).toBeCloseTo(0, 15)
    expect(Sin(-Math.PI)).toBeCloseTo(0, 15)
    expect(Sin(Math.PI / 6)).toBeCloseTo(0.5, 15)
    expect(Sin(Math.PI / 4)).toBeCloseTo(Math.sqrt(2) / 2, 15)
    expect(Sin(Math.PI / 3)).toBeCloseTo(Math.sqrt(3) / 2, 15)
  })

  it('should handle special values', () => {
    expect(Number.isNaN(Sin(Number.POSITIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Sin(Number.NEGATIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Sin(Number.NaN))).toBe(true)
  })

  it('should handle large values', () => {
    expect(Sin(2 * Math.PI)).toBeCloseTo(0, 14)
    expect(Sin(4 * Math.PI)).toBeCloseTo(0, 14)
    expect(Sin(100 * Math.PI)).toBeCloseTo(0, 10)
  })

  it('should be periodic', () => {
    const x = 1.5
    expect(Sin(x)).toBeCloseTo(Sin(x + 2 * Math.PI), 14)
    expect(Sin(x)).toBeCloseTo(Sin(x + 4 * Math.PI), 14)
  })
})

describe('sin', () => {
  it('should work the same as Sin', () => {
    expect(sin(0)).toBe(Sin(0))
    expect(sin(Math.PI / 2)).toBe(Sin(Math.PI / 2))
    expect(sin(-Math.PI / 2)).toBe(Sin(-Math.PI / 2))
    expect(sin(Math.PI)).toBe(Sin(Math.PI))
  })
})

describe('Cos', () => {
  it('should return correct cosine values', () => {
    expect(Cos(0)).toBe(1)
    expect(Cos(Math.PI / 2)).toBeCloseTo(0, 15)
    expect(Cos(-Math.PI / 2)).toBeCloseTo(0, 15)
    expect(Cos(Math.PI)).toBeCloseTo(-1, 15)
    expect(Cos(-Math.PI)).toBeCloseTo(-1, 15)
    expect(Cos(Math.PI / 3)).toBeCloseTo(0.5, 15)
    expect(Cos(Math.PI / 4)).toBeCloseTo(Math.sqrt(2) / 2, 15)
    expect(Cos(Math.PI / 6)).toBeCloseTo(Math.sqrt(3) / 2, 15)
  })

  it('should handle special values', () => {
    expect(Number.isNaN(Cos(Number.POSITIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Cos(Number.NEGATIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Cos(Number.NaN))).toBe(true)
  })

  it('should handle large values', () => {
    expect(Cos(2 * Math.PI)).toBeCloseTo(1, 14)
    expect(Cos(4 * Math.PI)).toBeCloseTo(1, 14)
    expect(Cos(100 * Math.PI)).toBeCloseTo(1, 10)
  })

  it('should be periodic', () => {
    const x = 1.5
    expect(Cos(x)).toBeCloseTo(Cos(x + 2 * Math.PI), 14)
    expect(Cos(x)).toBeCloseTo(Cos(x + 4 * Math.PI), 14)
  })
})

describe('cos', () => {
  it('should work the same as Cos', () => {
    expect(cos(0)).toBe(Cos(0))
    expect(cos(Math.PI / 2)).toBe(Cos(Math.PI / 2))
    expect(cos(-Math.PI / 2)).toBe(Cos(-Math.PI / 2))
    expect(cos(Math.PI)).toBe(Cos(Math.PI))
  })
})
