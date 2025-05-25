import { describe, it, expect } from 'vitest'
import {
  stringFinder,
  makeStringFinder,
  longestCommonSuffix,
} from './search.js'

describe('strings/search', () => {
  describe('stringFinder', () => {
    it('should create a stringFinder instance', () => {
      const finder = new stringFinder({
        pattern: 'test',
        badCharSkip: new Array(256).fill(4),
        goodSuffixSkip: [0, 0, 0, 0],
      })

      expect(finder.pattern).toBe('test')
      expect(finder.badCharSkip).toHaveLength(256)
      expect(finder.goodSuffixSkip).toHaveLength(4)
    })

    it('should clone a stringFinder instance', () => {
      const original = new stringFinder({
        pattern: 'hello',
        badCharSkip: new Array(256).fill(5),
        goodSuffixSkip: [1, 2, 3, 4, 5],
      })

      const cloned = original.clone()

      expect(cloned.pattern).toBe(original.pattern)
      expect(cloned.badCharSkip).toEqual(original.badCharSkip)
      expect(cloned.goodSuffixSkip).toEqual(original.goodSuffixSkip)

      // Ensure it's a deep clone
      cloned.pattern = 'world'
      expect(original.pattern).toBe('hello')
    })

    it('should find pattern in text using next method', () => {
      const finder = makeStringFinder('abc')
      expect(finder).not.toBeNull()

      if (finder) {
        expect(finder.next('abcdef')).toBe(0)
        expect(finder.next('xyzabc')).toBe(3)
        expect(finder.next('abcabc')).toBe(0)
        expect(finder.next('xyz')).toBe(-1)
      }
    })

    it('should handle empty pattern', () => {
      const finder = makeStringFinder('')
      expect(finder).not.toBeNull()

      if (finder) {
        expect(finder.next('anything')).toBe(0)
        expect(finder.next('')).toBe(0)
      }
    })

    it('should handle pattern not found', () => {
      const finder = makeStringFinder('xyz')
      expect(finder).not.toBeNull()

      if (finder) {
        expect(finder.next('abc')).toBe(-1)
        expect(finder.next('abcdef')).toBe(-1)
        expect(finder.next('')).toBe(-1)
      }
    })

    it('should handle pattern longer than text', () => {
      const finder = makeStringFinder('abcdef')
      expect(finder).not.toBeNull()

      if (finder) {
        expect(finder.next('abc')).toBe(-1)
        expect(finder.next('abcde')).toBe(-1)
        expect(finder.next('abcdef')).toBe(0)
      }
    })

    it('should find multiple occurrences correctly', () => {
      const finder = makeStringFinder('ab')
      expect(finder).not.toBeNull()

      if (finder) {
        const text = 'ababab'
        expect(finder.next(text)).toBe(0)
        expect(finder.next(text.slice(2))).toBe(0) // Should find at position 2 in original
        expect(finder.next(text.slice(4))).toBe(0) // Should find at position 4 in original
      }
    })

    it('should handle single character patterns', () => {
      const finder = makeStringFinder('a')
      expect(finder).not.toBeNull()

      if (finder) {
        expect(finder.next('abc')).toBe(0)
        expect(finder.next('bac')).toBe(1)
        expect(finder.next('bca')).toBe(2)
        expect(finder.next('xyz')).toBe(-1)
      }
    })

    it('should handle repeated character patterns', () => {
      const finder = makeStringFinder('aaa')
      expect(finder).not.toBeNull()

      if (finder) {
        expect(finder.next('aaaa')).toBe(0)
        expect(finder.next('baaaa')).toBe(1)
        expect(finder.next('aa')).toBe(-1)
        expect(finder.next('ababab')).toBe(-1)
      }
    })
  })

  describe('makeStringFinder', () => {
    it('should create a properly initialized stringFinder', () => {
      const pattern = 'hello'
      const finder = makeStringFinder(pattern)

      expect(finder).not.toBeNull()
      if (finder) {
        expect(finder.pattern).toBe(pattern)
        expect(finder.badCharSkip).toHaveLength(256)
        expect(finder.goodSuffixSkip).toHaveLength(pattern.length)

        // Test that bad character skip table is properly initialized
        // Characters not in pattern should skip the full pattern length
        expect(finder.badCharSkip[0]).toBe(pattern.length) // null character
        expect(finder.badCharSkip[255]).toBe(pattern.length) // high ASCII

        // Characters in pattern should have appropriate skip values
        const hIndex = 'h'.charCodeAt(0)
        const eIndex = 'e'.charCodeAt(0)
        const lIndex = 'l'.charCodeAt(0)
        const oIndex = 'o'.charCodeAt(0)

        expect(finder.badCharSkip[hIndex]).toBeLessThan(pattern.length)
        expect(finder.badCharSkip[eIndex]).toBeLessThan(pattern.length)
        expect(finder.badCharSkip[lIndex]).toBeLessThan(pattern.length)
        // 'o' is the last character, so it gets the full pattern length as skip value
        expect(finder.badCharSkip[oIndex]).toBe(pattern.length)
      }
    })

    it('should handle single character patterns', () => {
      const finder = makeStringFinder('x')

      expect(finder).not.toBeNull()
      if (finder) {
        expect(finder.pattern).toBe('x')
        expect(finder.goodSuffixSkip).toHaveLength(1)

        const xIndex = 'x'.charCodeAt(0)
        // For single character patterns, the character gets the full pattern length as skip value
        expect(finder.badCharSkip[xIndex]).toBe(1)
      }
    })

    it('should handle empty pattern', () => {
      const finder = makeStringFinder('')

      expect(finder).not.toBeNull()
      if (finder) {
        expect(finder.pattern).toBe('')
        expect(finder.goodSuffixSkip).toHaveLength(0)
      }
    })
  })

  describe('longestCommonSuffix', () => {
    it('should find longest common suffix', () => {
      expect(longestCommonSuffix('abc', 'bc')).toBe(2)
      expect(longestCommonSuffix('hello', 'llo')).toBe(3)
      expect(longestCommonSuffix('test', 'st')).toBe(2)
      expect(longestCommonSuffix('abcd', 'cd')).toBe(2)
    })

    it('should handle no common suffix', () => {
      expect(longestCommonSuffix('abc', 'def')).toBe(0)
      expect(longestCommonSuffix('hello', 'world')).toBe(0)
      expect(longestCommonSuffix('test', 'xyz')).toBe(0)
    })

    it('should handle identical strings', () => {
      expect(longestCommonSuffix('abc', 'abc')).toBe(3)
      expect(longestCommonSuffix('hello', 'hello')).toBe(5)
      expect(longestCommonSuffix('', '')).toBe(0)
    })

    it('should handle empty strings', () => {
      expect(longestCommonSuffix('', 'abc')).toBe(0)
      expect(longestCommonSuffix('abc', '')).toBe(0)
      expect(longestCommonSuffix('', '')).toBe(0)
    })

    it('should handle one string being suffix of another', () => {
      expect(longestCommonSuffix('hello', 'lo')).toBe(2)
      expect(longestCommonSuffix('testing', 'ing')).toBe(3)
      expect(longestCommonSuffix('abc', 'c')).toBe(1)
    })

    it('should handle single character strings', () => {
      expect(longestCommonSuffix('a', 'a')).toBe(1)
      expect(longestCommonSuffix('a', 'b')).toBe(0)
      expect(longestCommonSuffix('x', 'x')).toBe(1)
    })
  })
})
