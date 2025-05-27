import { describe, it, expect } from 'vitest'
import { Tan, tan } from './tan.gs.js'

describe('Tan', () => {
  it('should return correct tangent values', () => {
    expect(Tan(0)).toBe(0)
    expect(Tan(-0)).toBe(-0)
    expect(Tan(Math.PI / 4)).toBeCloseTo(1, 14)
    expect(Tan(-Math.PI / 4)).toBeCloseTo(-1, 15)
    expect(Tan(Math.PI)).toBeCloseTo(0, 14)
    expect(Tan(-Math.PI)).toBeCloseTo(0, 14)
    expect(Tan(Math.PI / 6)).toBeCloseTo(0.5773502691896257, 14)
    expect(Tan(Math.PI / 3)).toBeCloseTo(1.7320508075688772, 14)
  })

  it('should handle special values', () => {
    expect(Number.isNaN(Tan(Number.POSITIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Tan(Number.NEGATIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Tan(Number.NaN))).toBe(true)
  })

  it('should approach infinity near asymptotes', () => {
    const nearPiOver2 = Math.PI / 2 - 1e-10
    expect(Math.abs(Tan(nearPiOver2))).toBeGreaterThan(1e9)
    
    const near3PiOver2 = 3 * Math.PI / 2 - 1e-10
    expect(Math.abs(Tan(near3PiOver2))).toBeGreaterThan(1e9)
  })

  it('should be periodic', () => {
    const x = 1.5
    expect(Tan(x)).toBeCloseTo(Tan(x + Math.PI), 13)
    expect(Tan(x)).toBeCloseTo(Tan(x + 2 * Math.PI), 13)
  })

  it('should handle edge cases', () => {
    expect(Tan(Number.MIN_VALUE)).toBeCloseTo(Number.MIN_VALUE, 14)
    expect(Tan(-Number.MIN_VALUE)).toBeCloseTo(-Number.MIN_VALUE, 14)
  })
})

describe('tan', () => {
  it('should work the same as Tan', () => {
    expect(tan(0)).toBe(Tan(0))
    expect(tan(Math.PI / 4)).toBe(Tan(Math.PI / 4))
    expect(tan(-Math.PI / 4)).toBe(Tan(-Math.PI / 4))
    expect(tan(Math.PI)).toBe(Tan(Math.PI))
    expect(Number.isNaN(tan(Number.NaN))).toBe(Number.isNaN(Tan(Number.NaN)))
  })
}) 