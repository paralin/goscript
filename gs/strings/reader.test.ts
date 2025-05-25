import { describe, it, expect } from 'vitest'
import * as $ from '@goscript/builtin/builtin.js'
import { Reader, NewReader } from './reader.js'
import * as io from '@goscript/io/index.js'

describe('strings/Reader', () => {
  describe('NewReader', () => {
    it('should create a new reader', () => {
      const r = NewReader('hello world')
      expect(r).not.toBeNull()
      if (r) {
        expect(r.Size()).toBe(11)
        expect(r.Len()).toBe(11)
      }
    })
  })

  describe('Reader', () => {
    it('should read bytes', () => {
      const r = new Reader({ s: 'hello' })
      const buf = new Uint8Array(3)

      const [n, err] = r.Read(buf)
      expect(n).toBe(3)
      expect(err).toBeNull()
      expect(new TextDecoder().decode(buf)).toBe('hel')
      expect(r.Len()).toBe(2)
    })

    it('should read at specific offset', () => {
      const r = new Reader({ s: 'hello world' })
      const buf = new Uint8Array(5)

      const [n, err] = r.ReadAt(buf, 6)
      expect(n).toBe(5)
      expect(err).toBeNull()
      expect(new TextDecoder().decode(buf)).toBe('world')
    })

    it('should read at offset with EOF', () => {
      const r = new Reader({ s: 'hello' })
      const buf = new Uint8Array(10)

      const [n, err] = r.ReadAt(buf, 2)
      expect(n).toBe(3)
      expect(err).toBe(io.EOF)
      expect(new TextDecoder().decode(buf.subarray(0, n))).toBe('llo')
    })

    it('should handle negative offset in ReadAt', () => {
      const r = new Reader({ s: 'hello' })
      const buf = new Uint8Array(5)

      const [n, err] = r.ReadAt(buf, -1)
      expect(n).toBe(0)
      expect(err).not.toBeNull()
    })

    it('should read byte', () => {
      const r = new Reader({ s: 'hello' })

      const [b, err] = r.ReadByte()
      expect(b).toBe(104) // 'h'
      expect(err).toBeNull()
      expect(r.Len()).toBe(4)
    })

    it('should unread byte', () => {
      const r = new Reader({ s: 'hello' })
      r.ReadByte()

      const err = r.UnreadByte()
      expect(err).toBeNull()
      expect(r.Len()).toBe(5)
    })

    it('should handle unread byte at beginning', () => {
      const r = new Reader({ s: 'hello' })

      const err = r.UnreadByte()
      expect(err).not.toBeNull()
    })

    it('should read rune', () => {
      const r = new Reader({ s: 'hello' })

      const [rune, size, err] = r.ReadRune()
      expect(rune).toBe(104) // 'h'
      expect(size).toBe(1)
      expect(err).toBeNull()
      expect(r.Len()).toBe(4)
    })

    it('should read unicode rune', () => {
      const r = new Reader({ s: '世界' })

      const [rune, size, err] = r.ReadRune()
      expect(rune).toBe(0x4e16) // '世'
      expect(size).toBeGreaterThan(1)
      expect(err).toBeNull()
    })

    it('should unread rune', () => {
      const r = new Reader({ s: 'hello' })
      r.ReadRune()

      const err = r.UnreadRune()
      expect(err).toBeNull()
      expect(r.Len()).toBe(5)
    })

    it('should handle unread rune at beginning', () => {
      const r = new Reader({ s: 'hello' })

      const err = r.UnreadRune()
      expect(err).not.toBeNull()
    })

    it('should handle unread rune without previous ReadRune', () => {
      const r = new Reader({ s: 'hello' })
      r.ReadByte()

      const err = r.UnreadRune()
      expect(err).not.toBeNull()
    })

    it('should seek from start', () => {
      const r = new Reader({ s: 'hello world' })

      const [pos, err] = r.Seek(6, io.SeekStart)
      expect(pos).toBe(6)
      expect(err).toBeNull()
      expect(r.Len()).toBe(5)
    })

    it('should seek from current', () => {
      const r = new Reader({ s: 'hello world' })
      r.ReadByte() // advance to position 1

      const [pos, err] = r.Seek(2, io.SeekCurrent)
      expect(pos).toBe(3)
      expect(err).toBeNull()
    })

    it('should seek from end', () => {
      const r = new Reader({ s: 'hello world' })

      const [pos, err] = r.Seek(-5, io.SeekEnd)
      expect(pos).toBe(6)
      expect(err).toBeNull()
    })

    it('should handle invalid whence in seek', () => {
      const r = new Reader({ s: 'hello' })

      const [pos, err] = r.Seek(0, 999)
      expect(pos).toBe(0)
      expect(err).not.toBeNull()
    })

    it('should handle negative position in seek', () => {
      const r = new Reader({ s: 'hello' })

      const [pos, err] = r.Seek(-10, io.SeekStart)
      expect(pos).toBe(0)
      expect(err).not.toBeNull()
    })

    it('should write to writer', () => {
      const r = new Reader({ s: 'hello world' })
      r.ReadByte() // advance position

      const written: Uint8Array[] = []
      const writer: io.Writer = {
        Write: (p: Uint8Array) => {
          written.push(p.slice())
          return [p.length, null]
        },
      }

      const [n, err] = r.WriteTo(writer)
      expect(n).toBe(10) // remaining bytes
      expect(err).toBeNull()
      expect(r.Len()).toBe(0)
    })

    it('should reset reader', () => {
      const r = new Reader({ s: 'hello' })
      r.ReadByte()
      expect(r.Len()).toBe(4)

      r.Reset('world')
      expect(r.Size()).toBe(5)
      expect(r.Len()).toBe(5)
      expect(r.s).toBe('world')
    })

    it('should handle EOF on read', () => {
      const r = new Reader({ s: 'hi' })
      const buf = new Uint8Array(10)

      const [n, err] = r.Read(buf)
      expect(n).toBe(2)
      expect(err).toBeNull()

      const [n2, err2] = r.Read(buf)
      expect(n2).toBe(0)
      expect(err2).toBe(io.EOF)
    })

    it('should handle EOF on ReadByte', () => {
      const r = new Reader({ s: 'a' })
      r.ReadByte()

      const [b, err] = r.ReadByte()
      expect(b).toBe(0)
      expect(err).toBe(io.EOF)
    })

    it('should handle EOF on ReadRune', () => {
      const r = new Reader({ s: 'a' })
      r.ReadRune()

      const [rune, size, err] = r.ReadRune()
      expect(rune).toBe(0)
      expect(size).toBe(0)
      expect(err).toBe(io.EOF)
    })

    it('should clone reader', () => {
      const r = new Reader({ s: 'hello', i: 2, prevRune: 1 })
      const cloned = r.clone()

      expect(cloned.s).toBe('hello')
      expect(cloned.i).toBe(2)
      expect(cloned.prevRune).toBe(1)

      // Modify original
      r.i = 3
      expect(cloned.i).toBe(2) // Should not change
    })
  })
})
