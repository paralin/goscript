import { describe, it, expect } from 'vitest'
import { Compare } from './compare.js'

describe('strings/compare', () => {
  describe('Compare', () => {
    it('should return 0 for equal strings', () => {
      expect(Compare('hello', 'hello')).toBe(0)
      expect(Compare('', '')).toBe(0)
      expect(Compare('world', 'world')).toBe(0)
    })

    it('should return -1 when first string is lexicographically smaller', () => {
      expect(Compare('a', 'b')).toBe(-1)
      expect(Compare('abc', 'abd')).toBe(-1)
      expect(Compare('hello', 'world')).toBe(-1)
      expect(Compare('', 'a')).toBe(-1)
    })

    it('should return 1 when first string is lexicographically larger', () => {
      expect(Compare('b', 'a')).toBe(1)
      expect(Compare('abd', 'abc')).toBe(1)
      expect(Compare('world', 'hello')).toBe(1)
      expect(Compare('a', '')).toBe(1)
    })

    it('should handle strings of different lengths', () => {
      expect(Compare('abc', 'abcd')).toBe(-1)
      expect(Compare('abcd', 'abc')).toBe(1)
      expect(Compare('ab', 'abc')).toBe(-1)
      expect(Compare('abc', 'ab')).toBe(1)
    })

    it('should handle case sensitivity', () => {
      expect(Compare('a', 'A')).toBe(1) // lowercase > uppercase
      expect(Compare('A', 'a')).toBe(-1)
      expect(Compare('Hello', 'hello')).toBe(-1)
    })

    it('should handle unicode strings', () => {
      expect(Compare('世界', '世界')).toBe(0)
      expect(Compare('世', '界')).toBeLessThan(0)
      expect(Compare('🌟', '⭐')).toBeGreaterThan(0)
    })

    it('should handle special characters', () => {
      expect(Compare('!', '@')).toBe(-1)
      expect(Compare('@', '!')).toBe(1)
      expect(Compare('123', '456')).toBe(-1)
      expect(Compare('9', '10')).toBe(1) // string comparison, not numeric
    })

    it('should handle strings with spaces', () => {
      expect(Compare(' ', '')).toBe(1)
      expect(Compare('', ' ')).toBe(-1)
      expect(Compare('a b', 'ab')).toBe(-1) // space < 'b'
    })

    it('should handle mixed content', () => {
      expect(Compare('abc123', 'abc456')).toBe(-1)
      expect(Compare('Hello World', 'Hello world')).toBe(-1) // 'W' < 'w'
      expect(Compare('test\n', 'test\t')).toBe(1) // '\n' > '\t' (10 > 9)
    })

    it('should be consistent with built-in comparison', () => {
      const testCases = [
        ['hello', 'world'],
        ['abc', 'abc'],
        ['a', 'b'],
        ['', ''],
        ['longer', 'short'],
        ['123', '45'],
      ]

      testCases.forEach(([a, b]) => {
        const compareResult = Compare(a, b)
        const builtinResult =
          a < b ? -1
          : a > b ? 1
          : 0
        expect(compareResult).toBe(builtinResult)
      })
    })
  })
})
