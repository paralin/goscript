import { describe, it, expect } from 'vitest'
import { Clone } from './clone.js'

describe('strings/clone', () => {
  describe('Clone', () => {
    it('should return a copy of the string', () => {
      expect(Clone('hello')).toBe('hello')
      expect(Clone('world')).toBe('world')
    })

    it('should handle empty string', () => {
      expect(Clone('')).toBe('')
    })

    it('should handle unicode strings', () => {
      expect(Clone('Hello 世界')).toBe('Hello 世界')
      expect(Clone('🌟⭐✨')).toBe('🌟⭐✨')
    })

    it('should handle strings with special characters', () => {
      expect(Clone('Hello\nWorld\t!')).toBe('Hello\nWorld\t!')
      expect(Clone('quotes"and\'stuff')).toBe('quotes"and\'stuff')
    })

    it('should handle long strings', () => {
      const longString = 'a'.repeat(10000)
      expect(Clone(longString)).toBe(longString)
    })

    it('should handle strings with null bytes', () => {
      const stringWithNull = 'hello\0world'
      expect(Clone(stringWithNull)).toBe(stringWithNull)
    })

    it('should create independent copy semantically', () => {
      const original = 'test string'
      const cloned = Clone(original)
      expect(cloned).toBe(original)
      // In JavaScript, strings are immutable, so this is the expected behavior
      // The clone function maintains Go semantics where it guarantees a new allocation
    })
  })
})
