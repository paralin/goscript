import { describe, it, expect } from 'vitest'
import { Sincos } from './sincos.gs.js'

describe('Sincos', () => {
  it('should return correct sin and cos values for zero', () => {
    const [sin, cos] = Sincos(0)
    expect(sin).toBe(0)
    expect(cos).toBe(1)

    const [sinNeg, cosNeg] = Sincos(-0)
    expect(sinNeg).toBe(-0)
    expect(cosNeg).toBe(1)
  })

  it('should return correct sin and cos values for common angles', () => {
    const [sin1, cos1] = Sincos(Math.PI / 2)
    expect(sin1).toBeCloseTo(1, 15)
    expect(cos1).toBeCloseTo(0, 15)

    const [sin2, cos2] = Sincos(-Math.PI / 2)
    expect(sin2).toBeCloseTo(-1, 15)
    expect(cos2).toBeCloseTo(0, 15)

    const [sin3, cos3] = Sincos(Math.PI)
    expect(sin3).toBeCloseTo(0, 15)
    expect(cos3).toBeCloseTo(-1, 15)

    const [sin4, cos4] = Sincos(-Math.PI)
    expect(sin4).toBeCloseTo(0, 15)
    expect(cos4).toBeCloseTo(-1, 15)
  })

  it('should return correct sin and cos values for special angles', () => {
    const [sin1, cos1] = Sincos(Math.PI / 6)
    expect(sin1).toBeCloseTo(0.5, 15)
    expect(cos1).toBeCloseTo(Math.sqrt(3) / 2, 15)

    const [sin2, cos2] = Sincos(Math.PI / 4)
    expect(sin2).toBeCloseTo(Math.sqrt(2) / 2, 15)
    expect(cos2).toBeCloseTo(Math.sqrt(2) / 2, 15)

    const [sin3, cos3] = Sincos(Math.PI / 3)
    expect(sin3).toBeCloseTo(Math.sqrt(3) / 2, 15)
    expect(cos3).toBeCloseTo(0.5, 15)
  })

  it('should handle special values', () => {
    const [sin1, cos1] = Sincos(Number.POSITIVE_INFINITY)
    expect(Number.isNaN(sin1)).toBe(true)
    expect(Number.isNaN(cos1)).toBe(true)

    const [sin2, cos2] = Sincos(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(sin2)).toBe(true)
    expect(Number.isNaN(cos2)).toBe(true)

    const [sin3, cos3] = Sincos(Number.NaN)
    expect(Number.isNaN(sin3)).toBe(true)
    expect(Number.isNaN(cos3)).toBe(true)
  })

  it('should satisfy the Pythagorean identity', () => {
    const testValues = [
      0,
      Math.PI / 6,
      Math.PI / 4,
      Math.PI / 3,
      Math.PI / 2,
      Math.PI,
      1.5,
      2.7,
      -1.2,
    ]

    for (const x of testValues) {
      const [sin, cos] = Sincos(x)
      expect(sin * sin + cos * cos).toBeCloseTo(1, 14)
    }
  })

  it('should be periodic with period 2π', () => {
    const x = 1.5
    const [sin1, cos1] = Sincos(x)
    const [sin2, cos2] = Sincos(x + 2 * Math.PI)
    const [sin3, cos3] = Sincos(x + 4 * Math.PI)

    expect(sin1).toBeCloseTo(sin2, 14)
    expect(cos1).toBeCloseTo(cos2, 14)
    expect(sin1).toBeCloseTo(sin3, 14)
    expect(cos1).toBeCloseTo(cos3, 14)
  })

  it('should match individual Math.sin and Math.cos calls', () => {
    const testValues = [
      0,
      Math.PI / 6,
      Math.PI / 4,
      Math.PI / 3,
      Math.PI / 2,
      Math.PI,
      1.5,
      -1.2,
    ]

    for (const x of testValues) {
      const [sin, cos] = Sincos(x)
      expect(sin).toBeCloseTo(Math.sin(x), 15)
      expect(cos).toBeCloseTo(Math.cos(x), 15)
    }
  })
})
