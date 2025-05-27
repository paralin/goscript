import { describe, it, expect } from 'vitest'
import { Sqrt, sqrt } from './sqrt.gs.js'

describe('Sqrt', () => {
  it('should return correct square root values', () => {
    expect(Sqrt(0)).toBe(0)
    expect(Sqrt(-0)).toBe(-0)
    expect(Sqrt(1)).toBe(1)
    expect(Sqrt(4)).toBe(2)
    expect(Sqrt(9)).toBe(3)
    expect(Sqrt(16)).toBe(4)
    expect(Sqrt(25)).toBe(5)
  })

  it('should handle fractional values', () => {
    expect(Sqrt(0.25)).toBe(0.5)
    expect(Sqrt(0.01)).toBe(0.1)
    expect(Sqrt(2)).toBeCloseTo(1.4142135623730951, 14)
    expect(Sqrt(3)).toBeCloseTo(1.7320508075688772, 15)
  })

  it('should handle special values', () => {
    expect(Sqrt(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isNaN(Sqrt(-1))).toBe(true)
    expect(Number.isNaN(Sqrt(-10))).toBe(true)
    expect(Number.isNaN(Sqrt(Number.NaN))).toBe(true)
    expect(Number.isNaN(Sqrt(Number.NEGATIVE_INFINITY))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Sqrt(Number.MAX_VALUE)).toBeCloseTo(1.3407807929942596e154, 140)
    expect(Sqrt(Number.MIN_VALUE)).toBeCloseTo(1.4916681462400413e-154, 150)
  })

  it('should handle very small positive values', () => {
    expect(Sqrt(1e-100)).toBeCloseTo(1e-50, 14)
    expect(Sqrt(1e-200)).toBeCloseTo(1e-100, 14)
  })
})

describe('sqrt', () => {
  it('should work the same as Sqrt', () => {
    expect(sqrt(0)).toBe(Sqrt(0))
    expect(sqrt(1)).toBe(Sqrt(1))
    expect(sqrt(4)).toBe(Sqrt(4))
    expect(sqrt(9)).toBe(Sqrt(9))
    expect(Number.isNaN(sqrt(-1))).toBe(Number.isNaN(Sqrt(-1)))
  })
}) 