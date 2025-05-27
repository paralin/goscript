import { describe, it, expect } from 'vitest'
import { Dim, Max, max, Min, min } from './dim.gs.js'

describe('Dim', () => {
  it('should return maximum of x-y or 0', () => {
    expect(Dim(5, 3)).toBe(2)
    expect(Dim(3, 5)).toBe(0)
    expect(Dim(10, 10)).toBe(0)
    expect(Dim(-5, -3)).toBe(0)
    expect(Dim(-3, -5)).toBe(2)
  })

  it('should handle special cases', () => {
    expect(Number.isNaN(Dim(Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Dim(Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY))).toBe(true)
    expect(Number.isNaN(Dim(5, Number.NaN))).toBe(true)
    expect(Number.isNaN(Dim(Number.NaN, 5))).toBe(true)
  })

  it('should handle infinity cases', () => {
    expect(Dim(Number.POSITIVE_INFINITY, 5)).toBe(Number.POSITIVE_INFINITY)
    expect(Dim(5, Number.NEGATIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Dim(Number.NEGATIVE_INFINITY, 5)).toBe(0)
    expect(Dim(5, Number.POSITIVE_INFINITY)).toBe(0)
  })
})

describe('Max', () => {
  it('should return the larger value', () => {
    expect(Max(5, 3)).toBe(5)
    expect(Max(3, 5)).toBe(5)
    expect(Max(-5, -3)).toBe(-3)
    expect(Max(-3, -5)).toBe(-3)
    expect(Max(0, 0)).toBe(0)
  })

  it('should handle special cases', () => {
    expect(Max(5, Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Max(Number.POSITIVE_INFINITY, 5)).toBe(Number.POSITIVE_INFINITY)
    expect(Number.isNaN(Max(5, Number.NaN))).toBe(true)
    expect(Number.isNaN(Max(Number.NaN, 5))).toBe(true)
  })

  it('should handle zero cases correctly', () => {
    expect(Max(0, -0)).toBe(0)
    expect(Max(-0, 0)).toBe(0)
    expect(Max(-0, -0)).toBe(-0)
  })

  it('should handle infinity cases', () => {
    expect(Max(Number.NEGATIVE_INFINITY, 5)).toBe(5)
    expect(Max(5, Number.NEGATIVE_INFINITY)).toBe(5)
    expect(Max(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe('max', () => {
  it('should work the same as Max', () => {
    expect(max(5, 3)).toBe(Max(5, 3))
    expect(max(-5, -3)).toBe(Max(-5, -3))
    expect(max(0, -0)).toBe(Max(0, -0))
    expect(Number.isNaN(max(5, Number.NaN))).toBe(Number.isNaN(Max(5, Number.NaN)))
  })
})

describe('Min', () => {
  it('should return the smaller value', () => {
    expect(Min(5, 3)).toBe(3)
    expect(Min(3, 5)).toBe(3)
    expect(Min(-5, -3)).toBe(-5)
    expect(Min(-3, -5)).toBe(-5)
    expect(Min(0, 0)).toBe(0)
  })

  it('should handle special cases', () => {
    expect(Min(5, Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
    expect(Min(Number.NEGATIVE_INFINITY, 5)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Min(5, Number.NaN))).toBe(true)
    expect(Number.isNaN(Min(Number.NaN, 5))).toBe(true)
  })

  it('should handle zero cases correctly', () => {
    expect(Min(0, -0)).toBe(-0)
    expect(Min(-0, 0)).toBe(-0)
    expect(Min(0, 0)).toBe(0)
  })

  it('should handle infinity cases', () => {
    expect(Min(Number.POSITIVE_INFINITY, 5)).toBe(5)
    expect(Min(5, Number.POSITIVE_INFINITY)).toBe(5)
    expect(Min(Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
  })
})

describe('min', () => {
  it('should work the same as Min', () => {
    expect(min(5, 3)).toBe(Min(5, 3))
    expect(min(-5, -3)).toBe(Min(-5, -3))
    expect(min(0, -0)).toBe(Min(0, -0))
    expect(Number.isNaN(min(5, Number.NaN))).toBe(Number.isNaN(Min(5, Number.NaN)))
  })
}) 