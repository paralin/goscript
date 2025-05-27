import { describe, it, expect } from 'vitest'
import { Log, log } from './log.gs.js'

describe('Log', () => {
  it('should return correct natural logarithm values', () => {
    expect(Log(1)).toBe(0)
    expect(Log(Math.E)).toBeCloseTo(1, 15)
    expect(Log(Math.E * Math.E)).toBeCloseTo(2, 15)
    expect(Log(10)).toBeCloseTo(2.302585092994046, 15)
    expect(Log(2)).toBeCloseTo(0.6931471805599453, 15)
  })

  it('should handle special values', () => {
    expect(Log(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Log(0)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Log(-1))).toBe(true)
    expect(Number.isNaN(Log(-10))).toBe(true)
    expect(Number.isNaN(Log(Number.NaN))).toBe(true)
  })

  it('should handle edge cases', () => {
    expect(Log(Number.MAX_VALUE)).toBeCloseTo(709.782712893384, 10)
    expect(Log(Number.MIN_VALUE)).toBeCloseTo(-744.4400719213812, 10)
    expect(Number.isNaN(Log(Number.NEGATIVE_INFINITY))).toBe(true)
  })

  it('should handle values close to 1', () => {
    expect(Log(1.0001)).toBeCloseTo(0.00009999500033330834, 15)
    expect(Log(0.9999)).toBeCloseTo(-0.00010000500033335834, 15)
  })
})

describe('log', () => {
  it('should work the same as Log', () => {
    expect(log(1)).toBe(Log(1))
    expect(log(Math.E)).toBe(Log(Math.E))
    expect(log(10)).toBe(Log(10))
    expect(Number.isNaN(log(-1))).toBe(Number.isNaN(Log(-1)))
  })
}) 