import { describe, it, expect } from 'vitest'
import { DeepEqual } from './deepequal.js'
import { Value, BasicType, Int, String as StringType } from './type.js'

describe('DeepEqual', () => {
  it('should compare primitive values correctly', () => {
    expect(DeepEqual(5, 5)).toBe(true)
    expect(DeepEqual(5, 10)).toBe(false)

    expect(DeepEqual('hello', 'hello')).toBe(true)
    expect(DeepEqual('hello', 'world')).toBe(false)

    expect(DeepEqual(true, true)).toBe(true)
    expect(DeepEqual(true, false)).toBe(false)

    expect(DeepEqual(null, null)).toBe(true)
    expect(DeepEqual(undefined, undefined)).toBe(true)
    expect(DeepEqual(null, undefined)).toBe(false)
  })

  it('should compare arrays correctly', () => {
    expect(DeepEqual([1, 2, 3], [1, 2, 3])).toBe(true)
    expect(DeepEqual([1, 2, 3], [1, 2, 4])).toBe(false)
    expect(DeepEqual([1, 2, 3], [1, 2])).toBe(false)
  })

  it('should compare objects correctly', () => {
    expect(DeepEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(true)
    expect(DeepEqual({ a: 1, b: 2 }, { a: 1, b: 3 })).toBe(false)
    expect(DeepEqual({ a: 1, b: 2 }, { a: 1 })).toBe(false)
  })

  it('should compare Value objects correctly', () => {
    const v1 = new Value(42, new BasicType(Int, 'int'))
    const v2 = new Value(42, new BasicType(Int, 'int'))
    const v3 = new Value('hello', new BasicType(StringType, 'string'))

    expect(DeepEqual(v1, v2)).toBe(true)
    expect(DeepEqual(v1, v3)).toBe(false)
  })
})
