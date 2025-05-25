import { describe, it, expect } from 'vitest'
import * as unsafe from './unsafe.js'

describe('unsafe package', () => {
  it('should throw error for Alignof', () => {
    expect(() => unsafe.Alignof({})).toThrow('unsafe.Alignof is not supported in JavaScript/TypeScript')
  })

  it('should throw error for Offsetof', () => {
    expect(() => unsafe.Offsetof({})).toThrow('unsafe.Offsetof is not supported in JavaScript/TypeScript')
  })

  it('should throw error for Sizeof', () => {
    expect(() => unsafe.Sizeof({})).toThrow('unsafe.Sizeof is not supported in JavaScript/TypeScript')
  })

  it('should throw error for Add', () => {
    expect(() => unsafe.Add(null, 1)).toThrow('unsafe.Add is not supported in JavaScript/TypeScript')
  })

  it('should throw error for Slice', () => {
    expect(() => unsafe.Slice(null, 1)).toThrow('unsafe.Slice is not supported in JavaScript/TypeScript')
  })

  it('should throw error for SliceData', () => {
    expect(() => unsafe.SliceData([])).toThrow('unsafe.SliceData is not supported in JavaScript/TypeScript')
  })

  it('should throw error for String', () => {
    expect(() => unsafe.String(null, 1)).toThrow('unsafe.String is not supported in JavaScript/TypeScript')
  })

  it('should throw error for StringData', () => {
    expect(() => unsafe.StringData('test')).toThrow('unsafe.StringData is not supported in JavaScript/TypeScript')
  })

  it('should export IntegerType as number type', () => {
    // IntegerType is just a type alias, so we can't test it directly
    // But we can verify it's exported and can be used as a type
    const value: unsafe.IntegerType = 42
    expect(typeof value).toBe('number')
  })

  it('should export ArbitraryType and Pointer types', () => {
    // These are type aliases, so we can't test them directly
    // But we can verify they can be used as types
    const arbitrary: unsafe.ArbitraryType = 'anything'
    const pointer: unsafe.Pointer = null
    expect(arbitrary).toBe('anything')
    expect(pointer).toBe(null)
  })
}) 