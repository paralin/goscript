import { describe, it, expect } from 'vitest'
import { Atan, atan, xatan, satan } from './atan.gs.js'

describe('Atan', () => {
  it('should return correct arctangent values', () => {
    expect(Atan(0)).toBe(0)
    expect(Atan(1)).toBeCloseTo(0.7853981633974483, 15)
    expect(Atan(-1)).toBeCloseTo(-0.7853981633974483, 15)
    expect(Atan(Math.sqrt(3))).toBeCloseTo(Math.PI / 3, 15)
    expect(Atan(1 / Math.sqrt(3))).toBeCloseTo(Math.PI / 6, 15)
  })

  it('should handle special values', () => {
    expect(Atan(Number.POSITIVE_INFINITY)).toBeCloseTo(Math.PI / 2, 15)
    expect(Atan(Number.NEGATIVE_INFINITY)).toBeCloseTo(-Math.PI / 2, 15)
    expect(Number.isNaN(Atan(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Atan(Number.MAX_VALUE)).toBeCloseTo(Math.PI / 2, 15)
    expect(Atan(-Number.MAX_VALUE)).toBeCloseTo(-Math.PI / 2, 15)
    expect(Atan(Number.MIN_VALUE)).toBeCloseTo(Number.MIN_VALUE, 15)
  })
})

describe('atan', () => {
  it('should work the same as Atan', () => {
    expect(atan(0)).toBe(Atan(0))
    expect(atan(1)).toBe(Atan(1))
    expect(atan(-1)).toBe(Atan(-1))
    expect(atan(Number.POSITIVE_INFINITY)).toBe(Atan(Number.POSITIVE_INFINITY))
  })
})

describe('xatan', () => {
  it('should work for values in range [0, 0.66]', () => {
    expect(xatan(0)).toBe(0)
    expect(xatan(0.5)).toBeCloseTo(Math.atan(0.5), 15)
    expect(xatan(0.66)).toBeCloseTo(Math.atan(0.66), 15)
  })
})

describe('satan', () => {
  it('should work for positive values', () => {
    expect(satan(0)).toBe(0)
    expect(satan(1)).toBeCloseTo(Math.atan(1), 15)
    expect(satan(2)).toBeCloseTo(Math.atan(2), 15)
  })
}) 