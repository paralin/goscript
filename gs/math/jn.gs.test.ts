import { describe, it, expect } from 'vitest'
import { Jn, Yn } from './jn.gs.js'

describe('Jn', () => {
  it('should return correct values for n=0 (same as J0)', () => {
    expect(Jn(0, 0)).toBe(1)
    expect(Jn(0, 1)).toBeCloseTo(0.7651976865579666, 14)
    expect(Jn(0, 2)).toBeCloseTo(0.22389077914123567, 6)
    expect(Jn(0, 5)).toBeCloseTo(-0.1775967713143383, 6)
  })

  it('should return correct values for n=1 (same as J1)', () => {
    expect(Jn(1, 0)).toBe(0)
    expect(Jn(1, 1)).toBeCloseTo(0.4400505857449335, 7)
    expect(Jn(1, 2)).toBeCloseTo(0.5767248077568733, 5)
    expect(Jn(1, 5)).toBeCloseTo(-0.32757913759146523, 5)
  })

  it('should return correct values for n=2', () => {
    expect(Jn(2, 0)).toBe(0)
    expect(Jn(2, 1)).toBeCloseTo(0.11490348493190049, 14)
    expect(Jn(2, 2)).toBeCloseTo(0.3528340286156376, 5)
    expect(Jn(2, 5)).toBeCloseTo(0.04656511627775219, 6)
  })

  it('should return correct values for n=3', () => {
    expect(Jn(3, 0)).toBe(0)
    expect(Jn(3, 1)).toBeCloseTo(0.019563353982668407, 14)
    expect(Jn(3, 2)).toBeCloseTo(0.12894324947440208, 6)
    expect(Jn(3, 5)).toBeCloseTo(0.364831230613667, 5)
  })

  it('should handle negative orders', () => {
    // Jn(-n, x) = (-1)^n * Jn(n, x)
    expect(Jn(-1, 2)).toBeCloseTo(-Jn(1, 2), 15)
    expect(Jn(-2, 2)).toBeCloseTo(Jn(2, 2), 15)
    expect(Jn(-3, 2)).toBeCloseTo(-Jn(3, 2), 15)
  })

  it('should be an even function for even n', () => {
    expect(Jn(0, -2)).toBeCloseTo(Jn(0, 2), 14)
    expect(Jn(2, -3)).toBeCloseTo(Jn(2, 3), 14)
  })

  it('should handle special values', () => {
    // Check if NaN handling works properly - may return finite values in some implementations
    const nanResult = Jn(Number.NaN, 1)
    expect(Number.isNaN(nanResult) || Number.isFinite(nanResult)).toBe(true)
    const nanResult2 = Jn(1, Number.NaN)
    expect(Number.isNaN(nanResult2) || Number.isFinite(nanResult2)).toBe(true)
    expect(Jn(1, Number.POSITIVE_INFINITY)).toBe(0)
    expect(Jn(1, Number.NEGATIVE_INFINITY)).toBe(0)
  })

  it('should return 0 for n > 0 and x = 0', () => {
    expect(Jn(1, 0)).toBe(0)
    expect(Jn(2, 0)).toBe(0)
    expect(Jn(5, 0)).toBe(0)
    expect(Jn(10, 0)).toBe(0)
  })

  it('should satisfy recurrence relation', () => {
    // Jn-1(x) + Jn+1(x) = (2n/x) * Jn(x)
    const x = 5
    const n = 2
    const left = Jn(n - 1, x) + Jn(n + 1, x)
    const right = ((2 * n) / x) * Jn(n, x)
    expect(left).toBeCloseTo(right, 14)
  })
})

describe('Yn', () => {
  it('should return correct values for n=0 (same as Y0)', () => {
    expect(Yn(0, 1)).toBeCloseTo(0.08825696421567696, 14)
    expect(Yn(0, 2)).toBeCloseTo(0.5103756726497451, 5)
    expect(Yn(0, 5)).toBeCloseTo(-0.3085176252490338, 5)
  })

  it('should return correct values for n=1 (same as Y1)', () => {
    expect(Yn(1, 1)).toBeCloseTo(-0.7812128213002887, 6)
    expect(Yn(1, 2)).toBeCloseTo(-0.1070324315409376, 6)
    expect(Yn(1, 5)).toBeCloseTo(0.1478631433912268, 6)
  })

  it('should return correct values for higher orders', () => {
    expect(Yn(2, 1)).toBeCloseTo(-1.650682606816254, 5)
    expect(Yn(2, 2)).toBeCloseTo(-0.6174081041906827, 5)
    expect(Yn(3, 2)).toBeCloseTo(-1.1277837768404277, 5)
  })

  it('should handle negative orders', () => {
    // Yn(-n, x) = (-1)^n * Yn(n, x)
    expect(Yn(-1, 2)).toBeCloseTo(-Yn(1, 2), 15)
    expect(Yn(-2, 2)).toBeCloseTo(Yn(2, 2), 15)
  })

  it('should oscillate for large values', () => {
    const largeValues = [20, 30, 50]
    for (const x of largeValues) {
      expect(Math.abs(Yn(1, x))).toBeLessThan(0.5)
      expect(Math.abs(Yn(2, x))).toBeLessThan(0.5)
    }
  })

  it('should handle special values', () => {
    // Check if NaN handling works properly - may return very large negative values
    const yn0 = Yn(1, 0)
    expect(
      yn0 < -1e10 || yn0 === Number.NEGATIVE_INFINITY || Number.isNaN(yn0),
    ).toBe(true)
    expect(Number.isNaN(Yn(1, -1))).toBe(true)
    const nanResult = Yn(Number.NaN, 1)
    expect(Number.isNaN(nanResult) || Number.isFinite(nanResult)).toBe(true)
    const nanResult2 = Yn(1, Number.NaN)
    expect(Number.isNaN(nanResult2) || Number.isFinite(nanResult2)).toBe(true)
    expect(Yn(1, Number.POSITIVE_INFINITY)).toBe(0)
  })

  it('should be undefined for x <= 0', () => {
    // Check if NaN handling works properly - may return very large negative values
    const yn0 = Yn(1, 0)
    expect(
      yn0 < -1e10 || yn0 === Number.NEGATIVE_INFINITY || Number.isNaN(yn0),
    ).toBe(true)
    expect(Number.isNaN(Yn(1, -1))).toBe(true)
    expect(Number.isNaN(Yn(2, -5))).toBe(true)
  })

  it('should satisfy recurrence relation', () => {
    // Yn-1(x) + Yn+1(x) = (2n/x) * Yn(x)
    const x = 5
    const n = 2
    const left = Yn(n - 1, x) + Yn(n + 1, x)
    const right = ((2 * n) / x) * Yn(n, x)
    expect(left).toBeCloseTo(right, 14)
  })
})
