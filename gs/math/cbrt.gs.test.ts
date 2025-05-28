import { describe, it, expect } from 'vitest'
import { Cbrt, cbrt } from './cbrt.gs.js'

describe('Cbrt', () => {
  it('should return correct cube root values', () => {
    expect(Cbrt(0)).toBe(0)
    expect(Cbrt(-0)).toBe(-0)
    expect(Cbrt(1)).toBe(1)
    expect(Cbrt(8)).toBe(2)
    expect(Cbrt(27)).toBe(3)
    expect(Cbrt(64)).toBe(4)
    expect(Cbrt(125)).toBe(5)
  })

  it('should handle negative values', () => {
    expect(Cbrt(-1)).toBe(-1)
    expect(Cbrt(-8)).toBe(-2)
    expect(Cbrt(-27)).toBe(-3)
    expect(Cbrt(-64)).toBe(-4)
    expect(Cbrt(-125)).toBe(-5)
  })

  it('should handle fractional values', () => {
    expect(Cbrt(0.125)).toBeCloseTo(0.5, 14)
    expect(Cbrt(0.001)).toBeCloseTo(0.1, 14)
    expect(Cbrt(2)).toBeCloseTo(1.2599210498948732, 15)
    expect(Cbrt(3)).toBeCloseTo(1.4422495703074083, 15)
  })

  it('should handle special values', () => {
    expect(Cbrt(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Cbrt(Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Cbrt(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Cbrt(Number.MAX_VALUE)).toBeCloseTo(5.643803094122362e102, 90)
    expect(Cbrt(Number.MIN_VALUE)).toBeCloseTo(3.725290298461914e-109, 100)
    expect(Cbrt(-Number.MAX_VALUE)).toBeCloseTo(-5.643803094122362e102, 90)
  })

  it('should handle very small values', () => {
    expect(Cbrt(1e-100)).toBeCloseTo(2.154434690031884e-34, 30)
    expect(Cbrt(-1e-100)).toBeCloseTo(-2.154434690031884e-34, 30)
  })
})

describe('cbrt', () => {
  it('should work the same as Cbrt', () => {
    expect(cbrt(0)).toBe(Cbrt(0))
    expect(cbrt(1)).toBe(Cbrt(1))
    expect(cbrt(8)).toBe(Cbrt(8))
    expect(cbrt(-8)).toBe(Cbrt(-8))
    expect(cbrt(Number.POSITIVE_INFINITY)).toBe(Cbrt(Number.POSITIVE_INFINITY))
    expect(cbrt(0.125)).toBe(Cbrt(0.125))
  })
})
