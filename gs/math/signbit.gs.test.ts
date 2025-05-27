import { describe, it, expect } from 'vitest'
import { Signbit } from './signbit.gs.js'

describe('Signbit', () => {
  it('should return false for positive numbers', () => {
    expect(Signbit(1)).toBe(false)
    expect(Signbit(5.5)).toBe(false)
    expect(Signbit(Number.MAX_VALUE)).toBe(false)
    expect(Signbit(Number.MIN_VALUE)).toBe(false)
  })

  it('should return true for negative numbers', () => {
    expect(Signbit(-1)).toBe(true)
    expect(Signbit(-5.5)).toBe(true)
    expect(Signbit(-Number.MAX_VALUE)).toBe(true)
    expect(Signbit(-Number.MIN_VALUE)).toBe(true)
  })

  it('should handle zero correctly', () => {
    expect(Signbit(0)).toBe(false)
    expect(Signbit(-0)).toBe(true)
  })

  it('should handle infinity correctly', () => {
    expect(Signbit(Number.POSITIVE_INFINITY)).toBe(false)
    expect(Signbit(Number.NEGATIVE_INFINITY)).toBe(true)
  })

  it('should handle NaN correctly', () => {
    expect(Signbit(Number.NaN)).toBe(false)
    expect(Signbit(-Number.NaN)).toBe(false) // NaN doesn't have a sign
  })
}) 