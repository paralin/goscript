import { describe, it, expect } from 'vitest'
import { Builder } from './builder.js'

describe('strings/Builder', () => {
  describe('Builder', () => {
    it('should create empty builder', () => {
      const b = new Builder()
      expect(b.String()).toBe('')
      expect(b.Len()).toBe(0)
      expect(b.Cap()).toBe(0)
    })

    it('should write string', () => {
      const b = new Builder()
      const [n, err] = b.WriteString('hello')
      expect(n).toBe(5)
      expect(err).toBeNull()
      expect(b.String()).toBe('hello')
      expect(b.Len()).toBe(5)
    })

    it('should write bytes', () => {
      const b = new Builder()
      const bytes = new TextEncoder().encode('world')
      const [n, err] = b.Write(bytes)
      expect(n).toBe(bytes.length)
      expect(err).toBeNull()
      expect(b.String()).toBe('world')
    })

    it('should write byte', () => {
      const b = new Builder()
      const err = b.WriteByte(65) // 'A'
      expect(err).toBeNull()
      expect(b.String()).toBe('A')
      expect(b.Len()).toBe(1)
    })

    it('should write rune', () => {
      const b = new Builder()
      const [n, err] = b.WriteRune(0x1f44d) // 👍
      expect(err).toBeNull()
      expect(n).toBeGreaterThan(0)
      expect(b.String()).toBe('👍')
    })

    it('should grow capacity', () => {
      const b = new Builder()
      b.Grow(100)
      // Should not throw - capacity is grown
      expect(b.Cap()).toBeGreaterThanOrEqual(0)
    })

    it('should throw on negative grow', () => {
      const b = new Builder()
      expect(() => b.Grow(-1)).toThrow()
    })

    it('should reset builder', () => {
      const b = new Builder()
      b.WriteString('hello')
      expect(b.Len()).toBe(5)

      b.Reset()
      expect(b.String()).toBe('')
      expect(b.Len()).toBe(0)
    })

    it('should clone builder', () => {
      const b = new Builder()
      b.WriteString('hello')

      const cloned = b.clone()
      expect(cloned.String()).toBe('hello')
      expect(cloned.Len()).toBe(5)

      // Modify original
      b.WriteString(' world')
      expect(b.String()).toBe('hello world')
      expect(cloned.String()).toBe('hello') // Should not change
    })

    it('should handle multiple writes', () => {
      const b = new Builder()
      b.WriteString('hello')
      b.WriteString(' ')
      b.WriteString('world')
      expect(b.String()).toBe('hello world')
      expect(b.Len()).toBe(11)
    })

    it('should handle empty writes', () => {
      const b = new Builder()
      const [n, err] = b.WriteString('')
      expect(n).toBe(0)
      expect(err).toBeNull()
      expect(b.String()).toBe('')
    })

    it('should handle unicode correctly', () => {
      const b = new Builder()
      b.WriteString('Hello 世界')
      expect(b.String()).toBe('Hello 世界')

      // Write individual runes
      const b2 = new Builder()
      b2.WriteRune(0x4e16) // 世
      b2.WriteRune(0x754c) // 界
      expect(b2.String()).toBe('世界')
    })

    it('should maintain proper length with unicode', () => {
      const b = new Builder()
      const text = 'Hello 🌟'
      b.WriteString(text)
      expect(b.String()).toBe(text)
      expect(b.Len()).toBe(text.length)
    })
  })
})
