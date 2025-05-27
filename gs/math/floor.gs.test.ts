import { describe, it, expect } from 'vitest'
import { Floor, floor, Ceil, ceil, Trunc, trunc, Round, RoundToEven } from './floor.gs.js'

describe('Floor', () => {
  it('should return correct floor values', () => {
    expect(Floor(4.8)).toBe(4)
    expect(Floor(4.2)).toBe(4)
    expect(Floor(-4.2)).toBe(-5)
    expect(Floor(-4.8)).toBe(-5)
    expect(Floor(0)).toBe(0)
    expect(Floor(-0)).toBe(-0)
  })

  it('should handle special values', () => {
    expect(Floor(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Floor(Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Floor(Number.NaN))).toBe(true)
  })

  it('should handle integer values', () => {
    expect(Floor(5)).toBe(5)
    expect(Floor(-5)).toBe(-5)
    expect(Floor(0)).toBe(0)
  })
})

describe('floor', () => {
  it('should work the same as Floor', () => {
    expect(floor(4.8)).toBe(Floor(4.8))
    expect(floor(-4.2)).toBe(Floor(-4.2))
    expect(floor(Number.POSITIVE_INFINITY)).toBe(Floor(Number.POSITIVE_INFINITY))
  })
})

describe('Ceil', () => {
  it('should return correct ceiling values', () => {
    expect(Ceil(4.2)).toBe(5)
    expect(Ceil(4.8)).toBe(5)
    expect(Ceil(-4.8)).toBe(-4)
    expect(Ceil(-4.2)).toBe(-4)
    expect(Ceil(0)).toBe(0)
    expect(Ceil(-0)).toBe(-0)
  })

  it('should handle special values', () => {
    expect(Ceil(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Ceil(Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Ceil(Number.NaN))).toBe(true)
  })

  it('should handle integer values', () => {
    expect(Ceil(5)).toBe(5)
    expect(Ceil(-5)).toBe(-5)
    expect(Ceil(0)).toBe(0)
  })
})

describe('ceil', () => {
  it('should work the same as Ceil', () => {
    expect(ceil(4.2)).toBe(Ceil(4.2))
    expect(ceil(-4.8)).toBe(Ceil(-4.8))
    expect(ceil(Number.POSITIVE_INFINITY)).toBe(Ceil(Number.POSITIVE_INFINITY))
  })
})

describe('Trunc', () => {
  it('should return correct truncated values', () => {
    expect(Trunc(4.8)).toBe(4)
    expect(Trunc(4.2)).toBe(4)
    expect(Trunc(-4.2)).toBe(-4)
    expect(Trunc(-4.8)).toBe(-4)
    expect(Trunc(0)).toBe(0)
    expect(Trunc(-0)).toBe(-0)
  })

  it('should handle special values', () => {
    expect(Trunc(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Trunc(Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Trunc(Number.NaN))).toBe(true)
  })

  it('should handle integer values', () => {
    expect(Trunc(5)).toBe(5)
    expect(Trunc(-5)).toBe(-5)
    expect(Trunc(0)).toBe(0)
  })
})

describe('trunc', () => {
  it('should work the same as Trunc', () => {
    expect(trunc(4.8)).toBe(Trunc(4.8))
    expect(trunc(-4.2)).toBe(Trunc(-4.2))
    expect(trunc(Number.POSITIVE_INFINITY)).toBe(Trunc(Number.POSITIVE_INFINITY))
  })
})

describe('Round', () => {
  it('should return correct rounded values', () => {
    expect(Round(4.5)).toBe(5)
    expect(Round(4.4)).toBe(4)
    expect(Round(4.6)).toBe(5)
    expect(Round(-4.5)).toBe(-4)
    expect(Round(-4.4)).toBe(-4)
    expect(Round(-4.6)).toBe(-5)
    expect(Round(0)).toBe(0)
    expect(Round(-0)).toBe(-0)
  })

  it('should handle special values', () => {
    expect(Round(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(Round(Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(Round(Number.NaN))).toBe(true)
  })

  it('should handle integer values', () => {
    expect(Round(5)).toBe(5)
    expect(Round(-5)).toBe(-5)
    expect(Round(0)).toBe(0)
  })
})

describe('RoundToEven', () => {
  it('should round ties to even', () => {
    expect(RoundToEven(2.5)).toBe(2)
    expect(RoundToEven(3.5)).toBe(4)
    expect(RoundToEven(4.5)).toBe(4)
    expect(RoundToEven(5.5)).toBe(6)
    expect(RoundToEven(-2.5)).toBe(-2)
    expect(RoundToEven(-3.5)).toBe(-4)
  })

  it('should round normally when not exactly halfway', () => {
    expect(RoundToEven(2.4)).toBe(2)
    expect(RoundToEven(2.6)).toBe(3)
    expect(RoundToEven(-2.4)).toBe(-2)
    expect(RoundToEven(-2.6)).toBe(-3)
  })

  it('should handle special values', () => {
    expect(RoundToEven(Number.POSITIVE_INFINITY)).toBe(Number.POSITIVE_INFINITY)
    expect(RoundToEven(Number.NEGATIVE_INFINITY)).toBe(Number.NEGATIVE_INFINITY)
    expect(Number.isNaN(RoundToEven(Number.NaN))).toBe(true)
    expect(RoundToEven(0)).toBe(0)
    expect(RoundToEven(-0)).toBe(-0)
  })
}) 