// Package utf8 implements functions and constants to support text encoded in UTF-8.

import * as $ from '@goscript/builtin/builtin.js'

// RuneError is the "error" Rune or "Unicode replacement character"
export const RuneError = 0xfffd

// RuneSelf is the maximum rune value that can be represented as a single byte.
export const RuneSelf = 0x80

// MaxRune is the maximum valid Unicode code point.
export const MaxRune = 0x10ffff

// UTFMax is the maximum number of bytes of a UTF-8 encoded Unicode character.
export const UTFMax = 4

// AppendRune appends the UTF-8 encoding of r to the end of p and returns the extended buffer.
export function AppendRune(p: Uint8Array, r: number): Uint8Array {
  const temp = new Uint8Array(UTFMax)
  const n = EncodeRune(temp, r)
  const result = new Uint8Array(p.length + n)
  result.set(p)
  result.set(temp.slice(0, n), p.length)
  return result
}

// DecodeLastRune unpacks the last UTF-8 encoding in p and returns the rune and its width in bytes.
export function DecodeLastRune(p: Uint8Array): [number, number] {
  if (p.length === 0) {
    return [RuneError, 0]
  }

  // Simple implementation - find the start of the last rune
  let start = p.length - 1
  while (start > 0 && !RuneStart(p[start])) {
    start--
  }

  const [r, size] = DecodeRune(p.slice(start))
  if (start + size !== p.length) {
    return [RuneError, 1]
  }
  return [r, size]
}

// DecodeLastRuneInString is like DecodeLastRune but its input is a string.
export function DecodeLastRuneInString(s: string): [number, number] {
  if (s.length === 0) {
    return [RuneError, 0]
  }

  // Use JavaScript's built-in Unicode handling
  const chars = [...s]
  if (chars.length === 0) {
    return [RuneError, 0]
  }

  const lastChar = chars[chars.length - 1]
  const codePoint = lastChar.codePointAt(0) || RuneError
  const encoder = new TextEncoder()
  const encoded = encoder.encode(lastChar)
  return [codePoint, encoded.length]
}

// DecodeRune unpacks the first UTF-8 encoding in p and returns the rune and its width in bytes.
export function DecodeRune(p: Uint8Array): [number, number] {
  if (p.length === 0) {
    return [RuneError, 0]
  }

  if (p[0] < RuneSelf) {
    return [p[0], 1]
  }

  // Convert bytes to string and decode
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const str = decoder.decode(p.slice(0, Math.min(4, p.length)))
  if (str.length === 0 || str === '\uFFFD') {
    return [RuneError, 1]
  }

  const codePoint = str.codePointAt(0) || RuneError
  const char = String.fromCodePoint(codePoint)
  const encoder = new TextEncoder()
  const encoded = encoder.encode(char)
  return [codePoint, encoded.length]
}

// DecodeRuneInString is like DecodeRune but its input is a string.
export function DecodeRuneInString(s: string): [number, number] {
  if (s.length === 0) {
    return [RuneError, 0]
  }

  const c = s.charCodeAt(0)
  if (c < RuneSelf) {
    return [c, 1]
  }

  // Use JavaScript's built-in Unicode handling
  const codePoint = s.codePointAt(0) || RuneError
  const char = String.fromCodePoint(codePoint)
  const encoder = new TextEncoder()
  const encoded = encoder.encode(char)
  return [codePoint, encoded.length]
}

// EncodeRune writes into p (which must be large enough) the UTF-8 encoding of the rune.
export function EncodeRune(p: Uint8Array | $.Slice<number>, r: number): number {
  if (p === null) return 0

  if (!ValidRune(r)) {
    r = RuneError
  }

  const str = String.fromCodePoint(r)
  const encoder = new TextEncoder()
  const encoded = encoder.encode(str)

  // Handle both Uint8Array and Slice types
  if (p instanceof Uint8Array) {
    for (let i = 0; i < Math.min(encoded.length, p.length); i++) {
      p[i] = encoded[i]
    }
    return Math.min(encoded.length, p.length)
  } else {
    // Handle Slice<number>
    const len = $.len(p!)
    for (let i = 0; i < Math.min(encoded.length, len); i++) {
      ;(p as $.Slice<number>)![i] = encoded[i]
    }
    return Math.min(encoded.length, len)
  }
}

// FullRune reports whether the bytes in p begin with a full UTF-8 encoding of a rune.
export function FullRune(p: Uint8Array): boolean {
  if (p.length === 0) {
    return false
  }

  if (p[0] < RuneSelf) {
    return true
  }

  const [, size] = DecodeRune(p)
  return size <= p.length && size > 0
}

// FullRuneInString is like FullRune but its input is a string.
export function FullRuneInString(s: string): boolean {
  if (s.length === 0) {
    return false
  }

  const c = s.charCodeAt(0)
  if (c < RuneSelf) {
    return true
  }

  const [, size] = DecodeRuneInString(s)
  return size <= s.length && size > 0
}

// RuneCount returns the number of runes in p.
export function RuneCount(p: Uint8Array): number {
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const str = decoder.decode(p)
  return [...str].length
}

// RuneCountInString is like RuneCount but its input is a string.
export function RuneCountInString(s: string): number {
  return [...s].length
}

// RuneLen returns the number of bytes required to encode the rune.
export function RuneLen(r: number): number {
  if (!ValidRune(r)) {
    return -1
  }

  if (r < RuneSelf) {
    return 1
  }

  const str = String.fromCodePoint(r)
  const encoder = new TextEncoder()
  return encoder.encode(str).length
}

// RuneStart reports whether the byte could be the first byte of an encoded, possibly invalid rune.
export function RuneStart(b: number): boolean {
  return (b & 0xc0) !== 0x80
}

// Valid reports whether p consists entirely of valid UTF-8-encoded runes.
export function Valid(p: Uint8Array): boolean {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true })
    decoder.decode(p)
    return true
  } catch {
    return false
  }
}

// ValidRune reports whether r can be legally encoded as UTF-8.
export function ValidRune(r: number): boolean {
  return r >= 0 && r <= MaxRune && !(r >= 0xd800 && r <= 0xdfff)
}

// ValidString reports whether s consists entirely of valid UTF-8-encoded runes.
export function ValidString(s: string): boolean {
  // JavaScript strings are always valid UTF-16, but we check for surrogates
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i)
    if (code >= 0xd800 && code <= 0xdfff) {
      // Surrogate pair
      if (i + 1 >= s.length) return false
      const next = s.charCodeAt(i + 1)
      if (code >= 0xdc00 || next < 0xdc00 || next > 0xdfff) return false
      i++ // Skip the next character as it's part of the surrogate pair
    }
  }
  return true
}
