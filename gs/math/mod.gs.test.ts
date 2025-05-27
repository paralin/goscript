import { describe, it, expect } from 'vitest'
import { Mod, mod } from './mod.gs.js'

describe('Mod', () => {
  it('should return correct modulo values', () => {
    expect(Mod(7, 3)).toBe(1)
    expect(Mod(8, 3)).toBe(2)
    expect(Mod(9, 3)).toBe(0)
    expect(Mod(10, 3)).toBe(1)
  })

  it('should handle negative dividends', () => {
    expect(Mod(-7, 3)).toBe(-1)
    expect(Mod(-8, 3)).toBe(-2)
    expect(Mod(-9, 3)).toBe(-0)
    expect(Mod(-10, 3)).toBe(-1)
  })

  it('should handle negative divisors', () => {
    expect(Mod(7, -3)).toBe(1)
    expect(Mod(8, -3)).toBe(2)
    expect(Mod(-7, -3)).toBe(-1)
    expect(Mod(-8, -3)).toBe(-2)
  })

  it('should handle fractional values', () => {
    expect(Mod(5.5, 2)).toBeCloseTo(1.5, 15)
    expect(Mod(7.5, 2.5)).toBeCloseTo(0, 15)
    expect(Mod(-5.5, 2)).toBeCloseTo(-1.5, 15)
  })

  it('should handle special cases', () => {
    expect(Number.isNaN(Mod(Number.POSITIVE_INFINITY, 3))).toBe(true)
    expect(Number.isNaN(Mod(Number.NEGATIVE_INFINITY, 3))).toBe(true)
    expect(Number.isNaN(Mod(Number.NaN, 3))).toBe(true)
    expect(Number.isNaN(Mod(5, 0))).toBe(true)
    expect(Number.isNaN(Mod(5, Number.NaN))).toBe(true)
    
    expect(Mod(5, Number.POSITIVE_INFINITY)).toBe(5)
    expect(Mod(5, Number.NEGATIVE_INFINITY)).toBe(5)
    expect(Mod(-5, Number.POSITIVE_INFINITY)).toBe(-5)
  })

  it('should handle zero dividend', () => {
    expect(Mod(0, 3)).toBe(0)
    expect(Mod(-0, 3)).toBe(-0)
  })

  it('should preserve sign of dividend', () => {
    expect(Math.sign(Mod(5, 3))).toBe(1)
    expect(Math.sign(Mod(-5, 3))).toBe(-1)
    expect(Math.sign(Mod(5, -3))).toBe(1)
    expect(Math.sign(Mod(-5, -3))).toBe(-1)
  })
})

describe('mod', () => {
  it('should work the same as Mod', () => {
    expect(mod(7, 3)).toBe(Mod(7, 3))
    expect(mod(-7, 3)).toBe(Mod(-7, 3))
    expect(mod(5.5, 2)).toBe(Mod(5.5, 2))
    expect(Number.isNaN(mod(5, 0))).toBe(Number.isNaN(Mod(5, 0)))
  })
}) 