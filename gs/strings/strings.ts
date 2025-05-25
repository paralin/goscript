import * as $ from '@goscript/builtin/builtin.js'

// Helper function to convert string to runes (code points)
function stringToRunes(s: string): number[] {
  const runes: number[] = []
  for (const char of s) {
    runes.push(char.codePointAt(0) || 0)
  }
  return runes
}

// Helper function to convert runes to string
function runesToString(runes: number[]): string {
  return String.fromCodePoint(...runes)
}

// Count counts the number of non-overlapping instances of substr in s.
// If substr is an empty string, Count returns 1 + the number of Unicode code points in s.
export function Count(s: string, substr: string): number {
  if (substr === '') {
    return [...s].length + 1 // Unicode-aware length
  }

  let count = 0
  let pos = 0
  while (true) {
    const index = s.indexOf(substr, pos)
    if (index === -1) break
    count++
    pos = index + substr.length
  }
  return count
}

// Contains reports whether substr is within s.
export function Contains(s: string, substr: string): boolean {
  return s.includes(substr)
}

// ContainsAny reports whether any Unicode code points in chars are within s.
export function ContainsAny(s: string, chars: string): boolean {
  for (const char of chars) {
    if (s.includes(char)) {
      return true
    }
  }
  return false
}

// ContainsRune reports whether the Unicode code point r is within s.
export function ContainsRune(s: string, r: number): boolean {
  const char = String.fromCodePoint(r)
  return s.includes(char)
}

// ContainsFunc reports whether any Unicode code points r within s satisfy f(r).
export function ContainsFunc(
  s: string,
  f: ((r: number) => boolean) | null,
): boolean {
  if (!f) return false
  for (const char of s) {
    const codePoint = char.codePointAt(0)
    if (codePoint !== undefined && f(codePoint)) {
      return true
    }
  }
  return false
}

// Index returns the index of the first instance of substr in s, or -1 if substr is not present in s.
export function Index(s: string, substr: string): number {
  return s.indexOf(substr)
}

// LastIndex returns the index of the last instance of substr in s, or -1 if substr is not present in s.
export function LastIndex(s: string, substr: string): number {
  return s.lastIndexOf(substr)
}

// IndexByte returns the index of the first instance of c in s, or -1 if c is not present in s.
export function IndexByte(s: string, c: number): number {
  const char = String.fromCharCode(c)
  return s.indexOf(char)
}

// IndexRune returns the index of the first instance of the Unicode code point r, or -1 if rune is not present in s.
export function IndexRune(s: string, r: number): number {
  const char = String.fromCodePoint(r)
  return s.indexOf(char)
}

// IndexAny returns the index of the first instance of any Unicode code point from chars in s, or -1 if no Unicode code point from chars is present in s.
export function IndexAny(s: string, chars: string): number {
  for (let i = 0; i < s.length; i++) {
    if (chars.includes(s[i])) {
      return i
    }
  }
  return -1
}

// LastIndexAny returns the index of the last instance of any Unicode code point from chars in s, or -1 if no Unicode code point from chars is present in s.
export function LastIndexAny(s: string, chars: string): number {
  for (let i = s.length - 1; i >= 0; i--) {
    if (chars.includes(s[i])) {
      return i
    }
  }
  return -1
}

// LastIndexByte returns the index of the last instance of c in s, or -1 if c is not present in s.
export function LastIndexByte(s: string, c: number): number {
  const char = String.fromCharCode(c)
  return s.lastIndexOf(char)
}

// IndexFunc returns the index into s of the first Unicode code point satisfying f(c), or -1 if none do.
export function IndexFunc(
  s: string,
  f: ((r: number) => boolean) | null,
): number {
  if (!f) return -1
  let index = 0
  for (const char of s) {
    const codePoint = char.codePointAt(0)
    if (codePoint !== undefined && f(codePoint)) {
      return index
    }
    index += char.length
  }
  return -1
}

// LastIndexFunc returns the index into s of the last Unicode code point satisfying f(c), or -1 if none do.
export function LastIndexFunc(
  s: string,
  f: ((r: number) => boolean) | null,
): number {
  if (!f) return -1
  const chars = [...s]
  for (let i = chars.length - 1; i >= 0; i--) {
    const codePoint = chars[i].codePointAt(0)
    if (codePoint !== undefined && f(codePoint)) {
      // Calculate byte index
      return chars.slice(0, i).join('').length
    }
  }
  return -1
}

// Split slices s into all substrings separated by sep and returns a slice of the substrings between those separators.
export function Split(s: string, sep: string): $.Slice<string> {
  if (sep === '') {
    // Split into individual characters
    return $.arrayToSlice([...s])
  }
  return $.arrayToSlice(s.split(sep))
}

// SplitN slices s into substrings separated by sep and returns a slice of the substrings between those separators.
export function SplitN(s: string, sep: string, n: number): $.Slice<string> {
  if (n <= 0) {
    return $.arrayToSlice([])
  }
  if (n === 1) {
    return $.arrayToSlice([s])
  }
  if (sep === '') {
    const chars = [...s]
    return $.arrayToSlice(chars.slice(0, n))
  }

  const parts = s.split(sep)
  if (parts.length <= n) {
    return $.arrayToSlice(parts)
  }

  const result = parts.slice(0, n - 1)
  result.push(parts.slice(n - 1).join(sep))
  return $.arrayToSlice(result)
}

// SplitAfter slices s into all substrings after each instance of sep and returns a slice of those substrings.
export function SplitAfter(s: string, sep: string): $.Slice<string> {
  return SplitAfterN(s, sep, -1)
}

// SplitAfterN slices s into substrings after each instance of sep and returns a slice of those substrings.
export function SplitAfterN(
  s: string,
  sep: string,
  n: number,
): $.Slice<string> {
  if (n <= 0) {
    return $.arrayToSlice([])
  }
  if (sep === '') {
    const chars = [...s]
    return $.arrayToSlice(chars.slice(0, n))
  }

  const parts: string[] = []
  let start = 0
  let count = 0

  while (count < n - 1) {
    const index = s.indexOf(sep, start)
    if (index === -1) break
    parts.push(s.slice(start, index + sep.length))
    start = index + sep.length
    count++
  }

  if (start < s.length) {
    parts.push(s.slice(start))
  }

  return $.arrayToSlice(parts)
}

// Fields splits the string s around each instance of one or more consecutive white space characters.
export function Fields(s: string): $.Slice<string> {
  return $.arrayToSlice(
    s
      .trim()
      .split(/\s+/)
      .filter((part) => part.length > 0),
  )
}

// FieldsFunc splits the string s at each run of Unicode code points c satisfying f(c) and returns an array of slices of s.
export function FieldsFunc(
  s: string,
  f: ((r: number) => boolean) | null,
): $.Slice<string> {
  if (!f) return $.arrayToSlice([s])

  const parts: string[] = []
  let start = 0
  let inField = false

  let index = 0
  for (const char of s) {
    const codePoint = char.codePointAt(0)
    if (codePoint !== undefined && f(codePoint)) {
      if (inField) {
        parts.push(s.slice(start, index))
        inField = false
      }
    } else {
      if (!inField) {
        start = index
        inField = true
      }
    }
    index += char.length
  }

  if (inField) {
    parts.push(s.slice(start))
  }

  return $.arrayToSlice(parts)
}

// Join concatenates the elements of elems to create a single string. The separator string sep is placed between elements in the resulting string.
export function Join(elems: $.Slice<string>, sep: string): string {
  return $.asArray(elems).join(sep)
}

// HasPrefix tests whether the string s begins with prefix.
export function HasPrefix(s: string, prefix: string): boolean {
  return s.startsWith(prefix)
}

// HasSuffix tests whether the string s ends with suffix.
export function HasSuffix(s: string, suffix: string): boolean {
  return s.endsWith(suffix)
}

// Map returns a copy of the string s with all its characters modified according to the mapping function.
export function Map(
  mapping: ((r: number) => number) | null,
  s: string,
): string {
  if (!mapping) return s

  let result = ''
  for (const char of s) {
    const codePoint = char.codePointAt(0)
    if (codePoint !== undefined) {
      const mapped = mapping(codePoint)
      result += String.fromCodePoint(mapped)
    }
  }
  return result
}

// Repeat returns a new string consisting of count copies of the string s.
export function Repeat(s: string, count: number): string {
  if (count < 0) {
    $.panic('strings: negative Repeat count')
  }
  return s.repeat(count)
}

// ToUpper returns s with all Unicode letters mapped to their upper case.
export function ToUpper(s: string): string {
  return s.toUpperCase()
}

// ToLower returns s with all Unicode letters mapped to their lower case.
export function ToLower(s: string): string {
  return s.toLowerCase()
}

// ToTitle returns a copy of the string s with all Unicode letters mapped to their Unicode title case.
export function ToTitle(s: string): string {
  // JavaScript doesn't have a direct toTitleCase, so we'll use a simple approximation
  return s
    .split(' ')
    .map((word) =>
      word.length > 0 ?
        word[0].toUpperCase() + word.slice(1).toLowerCase()
      : word,
    )
    .join(' ')
}

// Title returns a copy of the string s with all Unicode letters that begin words mapped to their Unicode title case.
export function Title(s: string): string {
  return ToTitle(s)
}

// TrimSpace returns a slice of the string s, with all leading and trailing white space removed.
export function TrimSpace(s: string): string {
  return s.trim()
}

// Trim returns a slice of the string s with all leading and trailing Unicode code points contained in cutset removed.
export function Trim(s: string, cutset: string): string {
  return TrimFunc(s, (r: number) => cutset.includes(String.fromCodePoint(r)))
}

// TrimLeft returns a slice of the string s with all leading Unicode code points contained in cutset removed.
export function TrimLeft(s: string, cutset: string): string {
  return TrimLeftFunc(s, (r: number) =>
    cutset.includes(String.fromCodePoint(r)),
  )
}

// TrimRight returns a slice of the string s with all trailing Unicode code points contained in cutset removed.
export function TrimRight(s: string, cutset: string): string {
  return TrimRightFunc(s, (r: number) =>
    cutset.includes(String.fromCodePoint(r)),
  )
}

// TrimFunc returns a slice of the string s with all leading and trailing Unicode code points c satisfying f(c) removed.
export function TrimFunc(
  s: string,
  f: ((r: number) => boolean) | null,
): string {
  if (!f) return s
  return TrimRightFunc(TrimLeftFunc(s, f), f)
}

// TrimLeftFunc returns a slice of the string s with all leading Unicode code points c satisfying f(c) removed.
export function TrimLeftFunc(
  s: string,
  f: ((r: number) => boolean) | null,
): string {
  if (!f) return s

  let start = 0
  for (const char of s) {
    const codePoint = char.codePointAt(0)
    if (codePoint === undefined || !f(codePoint)) {
      break
    }
    start += char.length
  }
  return s.slice(start)
}

// TrimRightFunc returns a slice of the string s with all trailing Unicode code points c satisfying f(c) removed.
export function TrimRightFunc(
  s: string,
  f: ((r: number) => boolean) | null,
): string {
  if (!f) return s

  const chars = [...s]
  let end = chars.length
  for (let i = chars.length - 1; i >= 0; i--) {
    const codePoint = chars[i].codePointAt(0)
    if (codePoint === undefined || !f(codePoint)) {
      break
    }
    end = i
  }
  return chars.slice(0, end).join('')
}

// TrimPrefix returns s without the provided leading prefix string. If s doesn't start with prefix, s is returned unchanged.
export function TrimPrefix(s: string, prefix: string): string {
  if (s.startsWith(prefix)) {
    return s.slice(prefix.length)
  }
  return s
}

// TrimSuffix returns s without the provided ending suffix string. If s doesn't end with suffix, s is returned unchanged.
export function TrimSuffix(s: string, suffix: string): string {
  if (s.endsWith(suffix)) {
    return s.slice(0, s.length - suffix.length)
  }
  return s
}

// Replace returns a copy of the string s with the first n non-overlapping instances of old replaced by new.
export function Replace(
  s: string,
  old: string,
  newStr: string,
  n: number,
): string {
  if (n <= 0 || old === '') {
    return s
  }

  let result = s
  let count = 0
  let pos = 0

  while (count < n) {
    const index = result.indexOf(old, pos)
    if (index === -1) break

    result = result.slice(0, index) + newStr + result.slice(index + old.length)
    pos = index + newStr.length
    count++
  }

  return result
}

// ReplaceAll returns a copy of the string s with all non-overlapping instances of old replaced by new.
export function ReplaceAll(s: string, old: string, newStr: string): string {
  if (old === '') {
    return s
  }
  return s.split(old).join(newStr)
}

// EqualFold reports whether s and t, interpreted as UTF-8 strings, are equal under Unicode case-folding.
export function EqualFold(s: string, t: string): boolean {
  return s.toLowerCase() === t.toLowerCase()
}

// Compare returns an integer comparing two strings lexicographically.
export function Compare(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

// Cut slices s around the first instance of sep, returning the text before and after sep.
export function Cut(s: string, sep: string): [string, string, boolean] {
  const index = s.indexOf(sep)
  if (index === -1) {
    return [s, '', false]
  }
  return [s.slice(0, index), s.slice(index + sep.length), true]
}

// CutPrefix returns s without the provided leading prefix string and reports whether it found the prefix.
export function CutPrefix(s: string, prefix: string): [string, boolean] {
  if (s.startsWith(prefix)) {
    return [s.slice(prefix.length), true]
  }
  return [s, false]
}

// CutSuffix returns s without the provided ending suffix string and reports whether it found the suffix.
export function CutSuffix(s: string, suffix: string): [string, boolean] {
  if (s.endsWith(suffix)) {
    return [s.slice(0, s.length - suffix.length), true]
  }
  return [s, false]
}

// Clone returns a fresh copy of s.
export function Clone(s: string): string {
  // In JavaScript, strings are immutable, so we can just return the string
  // But to match Go semantics, we'll create a new string
  return String(s)
}
