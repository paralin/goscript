import { describe, it, expect } from 'vitest'
import {
  E, Pi, Phi, Sqrt2, SqrtE, SqrtPi, SqrtPhi, Ln2, Log2E, Ln10, Log10E,
  MaxFloat32, SmallestNonzeroFloat32, MaxFloat64, SmallestNonzeroFloat64,
  MaxInt, MinInt, MaxInt8, MinInt8, MaxInt16, MinInt16, MaxInt32, MinInt32,
  MaxInt64, MinInt64, MaxUint, MaxUint8, MaxUint16, MaxUint32, MaxUint64
} from './const.gs.js'

describe('Mathematical Constants', () => {
  it('should have correct mathematical constants', () => {
    expect(E).toBe(Math.E)
    expect(Pi).toBe(Math.PI)
    expect(Sqrt2).toBe(Math.SQRT2)
    expect(SqrtE).toBe(Math.sqrt(Math.E))
    expect(SqrtPi).toBe(Math.sqrt(Math.PI))
    expect(Ln2).toBe(Math.LN2)
    expect(Log2E).toBe(Math.LOG2E)
    expect(Ln10).toBe(Math.LN10)
    expect(Log10E).toBe(Math.LOG10E)
  })

  it('should have correct Phi (golden ratio)', () => {
    expect(Phi).toBeCloseTo(1.618033988749895, 15)
    expect(SqrtPhi).toBeCloseTo(Math.sqrt(1.618033988749895), 15)
  })

  it('should have correct float limits', () => {
    expect(MaxFloat32).toBe(3.4028234663852886e+38)
    expect(SmallestNonzeroFloat32).toBe(1.401298464324817e-45)
    expect(MaxFloat64).toBe(Number.MAX_VALUE)
    expect(SmallestNonzeroFloat64).toBe(Number.MIN_VALUE)
  })

  it('should have correct integer limits', () => {
    expect(MaxInt8).toBe(127)
    expect(MinInt8).toBe(-128)
    expect(MaxInt16).toBe(32767)
    expect(MinInt16).toBe(-32768)
    expect(MaxInt32).toBe(2147483647)
    expect(MinInt32).toBe(-2147483648)
    expect(MaxUint8).toBe(255)
    expect(MaxUint16).toBe(65535)
    expect(MaxUint32).toBe(4294967295)
  })

  it('should have correct bigint limits', () => {
    expect(MaxInt).toBe(9223372036854775807n)
    expect(MinInt).toBe(-9223372036854775808n)
    expect(MaxInt64).toBe(9223372036854775807n)
    expect(MinInt64).toBe(-9223372036854775808n)
    expect(MaxUint).toBe(0xFFFFFFFFFFFFFFFFn)
    expect(MaxUint64).toBe(0xFFFFFFFFFFFFFFFFn)
  })
}) 