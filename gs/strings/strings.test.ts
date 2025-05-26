import { describe, it, expect } from 'vitest'
import * as $ from '../builtin/index.js'
import {
  Clone,
  Compare,
  Contains,
  ContainsAny,
  ContainsFunc,
  ContainsRune,
  Count,
  Cut,
  CutPrefix,
  CutSuffix,
  EqualFold,
  Fields,
  FieldsFunc,
  HasPrefix,
  HasSuffix,
  Index,
  IndexAny,
  IndexByte,
  IndexFunc,
  IndexRune,
  Join,
  LastIndex,
  LastIndexAny,
  LastIndexByte,
  LastIndexFunc,
  Map,
  Repeat,
  Replace,
  ReplaceAll,
  Split,
  SplitAfter,
  SplitAfterN,
  SplitN,
  Title,
  ToLower,
  ToTitle,
  ToUpper,
  Trim,
  TrimFunc,
  TrimLeft,
  TrimLeftFunc,
  TrimPrefix,
  TrimRight,
  TrimRightFunc,
  TrimSpace,
  TrimSuffix,
} from './strings.js'

describe('strings', () => {
  describe('Clone', () => {
    it('should return a copy of the string', () => {
      expect(Clone('hello')).toBe('hello')
      expect(Clone('')).toBe('')
      expect(Clone('unicode: 🌟')).toBe('unicode: 🌟')
    })
  })

  describe('Compare', () => {
    it('should compare strings lexicographically', () => {
      expect(Compare('a', 'b')).toBe(-1)
      expect(Compare('b', 'a')).toBe(1)
      expect(Compare('hello', 'hello')).toBe(0)
      expect(Compare('', '')).toBe(0)
      expect(Compare('abc', 'abcd')).toBe(-1)
    })
  })

  describe('Contains', () => {
    it('should check if substr is within s', () => {
      expect(Contains('hello world', 'world')).toBe(true)
      expect(Contains('hello world', 'xyz')).toBe(false)
      expect(Contains('', '')).toBe(true)
      expect(Contains('abc', '')).toBe(true)
      expect(Contains('', 'a')).toBe(false)
    })
  })

  describe('ContainsAny', () => {
    it('should check if any chars are within s', () => {
      expect(ContainsAny('hello', 'aeiou')).toBe(true)
      expect(ContainsAny('hello', 'xyz')).toBe(false)
      expect(ContainsAny('', 'abc')).toBe(false)
      expect(ContainsAny('abc', '')).toBe(false)
    })
  })

  describe('ContainsFunc', () => {
    it('should check if any rune satisfies predicate', () => {
      expect(ContainsFunc('hello', (r) => r === 101)).toBe(true) // 'e'
      expect(ContainsFunc('hello', (r) => r === 120)).toBe(false) // 'x'
      expect(ContainsFunc('', () => true)).toBe(false)
      expect(ContainsFunc('abc', null)).toBe(false)
    })
  })

  describe('ContainsRune', () => {
    it('should check if rune is within s', () => {
      expect(ContainsRune('hello', 101)).toBe(true) // 'e'
      expect(ContainsRune('hello', 120)).toBe(false) // 'x'
      expect(ContainsRune('', 97)).toBe(false) // 'a'
    })
  })

  describe('Count', () => {
    it('should count non-overlapping instances', () => {
      expect(Count('hello', 'l')).toBe(2)
      expect(Count('hello', 'll')).toBe(1)
      expect(Count('hello', 'x')).toBe(0)
      expect(Count('', '')).toBe(1)
      expect(Count('abc', '')).toBe(4)
    })
  })

  describe('Cut', () => {
    it('should cut string around first instance of sep', () => {
      expect(Cut('hello-world', '-')).toEqual(['hello', 'world', true])
      expect(Cut('hello', '-')).toEqual(['hello', '', false])
      expect(Cut('', '-')).toEqual(['', '', false])
      expect(Cut('a-b-c', '-')).toEqual(['a', 'b-c', true])
    })
  })

  describe('CutPrefix', () => {
    it('should cut prefix and report if found', () => {
      expect(CutPrefix('hello world', 'hello ')).toEqual(['world', true])
      expect(CutPrefix('hello world', 'hi ')).toEqual(['hello world', false])
      expect(CutPrefix('', '')).toEqual(['', true])
      expect(CutPrefix('abc', '')).toEqual(['abc', true])
    })
  })

  describe('CutSuffix', () => {
    it('should cut suffix and report if found', () => {
      expect(CutSuffix('hello world', ' world')).toEqual(['hello', true])
      expect(CutSuffix('hello world', ' universe')).toEqual([
        'hello world',
        false,
      ])
      expect(CutSuffix('', '')).toEqual(['', true])
      expect(CutSuffix('abc', '')).toEqual(['abc', true])
    })
  })

  describe('EqualFold', () => {
    it('should compare strings case-insensitively', () => {
      expect(EqualFold('hello', 'HELLO')).toBe(true)
      expect(EqualFold('Hello', 'hello')).toBe(true)
      expect(EqualFold('hello', 'world')).toBe(false)
      expect(EqualFold('', '')).toBe(true)
    })
  })

  describe('Fields', () => {
    it('should split around whitespace', () => {
      const result = Fields('  hello   world  ')
      expect($.asArray(result)).toEqual(['hello', 'world'])

      const empty = Fields('   ')
      expect($.asArray(empty)).toEqual([])

      const single = Fields('hello')
      expect($.asArray(single)).toEqual(['hello'])
    })
  })

  describe('FieldsFunc', () => {
    it('should split around runes satisfying predicate', () => {
      const result = FieldsFunc('a,b,c', (r) => r === 44) // comma
      expect($.asArray(result)).toEqual(['a', 'b', 'c'])

      const empty = FieldsFunc('', () => true)
      expect($.asArray(empty)).toEqual([])

      const noSplit = FieldsFunc('abc', null)
      expect($.asArray(noSplit)).toEqual(['abc'])
    })
  })

  describe('HasPrefix', () => {
    it('should check if string begins with prefix', () => {
      expect(HasPrefix('hello world', 'hello')).toBe(true)
      expect(HasPrefix('hello world', 'world')).toBe(false)
      expect(HasPrefix('', '')).toBe(true)
      expect(HasPrefix('abc', '')).toBe(true)
    })
  })

  describe('HasSuffix', () => {
    it('should check if string ends with suffix', () => {
      expect(HasSuffix('hello world', 'world')).toBe(true)
      expect(HasSuffix('hello world', 'hello')).toBe(false)
      expect(HasSuffix('', '')).toBe(true)
      expect(HasSuffix('abc', '')).toBe(true)
    })
  })

  describe('Index', () => {
    it('should find first index of substr', () => {
      expect(Index('hello world', 'world')).toBe(6)
      expect(Index('hello world', 'xyz')).toBe(-1)
      expect(Index('hello', 'hello')).toBe(0)
      expect(Index('', '')).toBe(0)
    })
  })

  describe('IndexAny', () => {
    it('should find first index of any char from chars', () => {
      expect(IndexAny('hello', 'aeiou')).toBe(1) // 'e'
      expect(IndexAny('hello', 'xyz')).toBe(-1)
      expect(IndexAny('', 'abc')).toBe(-1)
    })
  })

  describe('IndexByte', () => {
    it('should find first index of byte', () => {
      expect(IndexByte('hello', 101)).toBe(1) // 'e'
      expect(IndexByte('hello', 120)).toBe(-1) // 'x'
      expect(IndexByte('', 97)).toBe(-1) // 'a'
    })
  })

  describe('IndexFunc', () => {
    it('should find first index where predicate is true', () => {
      expect(IndexFunc('hello', (r) => r === 101)).toBe(1) // 'e'
      expect(IndexFunc('hello', (r) => r === 120)).toBe(-1) // 'x'
      expect(IndexFunc('', () => true)).toBe(-1)
      expect(IndexFunc('abc', null)).toBe(-1)
    })
  })

  describe('IndexRune', () => {
    it('should find first index of rune', () => {
      expect(IndexRune('hello', 101)).toBe(1) // 'e'
      expect(IndexRune('hello', 120)).toBe(-1) // 'x'
      expect(IndexRune('', 97)).toBe(-1) // 'a'
    })
  })

  describe('Join', () => {
    it('should join slice elements with separator', () => {
      const slice = $.arrayToSlice(['hello', 'world'])
      expect(Join(slice, ' ')).toBe('hello world')

      const empty = $.arrayToSlice([])
      expect(Join(empty, ',')).toBe('')

      const single = $.arrayToSlice(['hello'])
      expect(Join(single, ',')).toBe('hello')
    })
  })

  describe('LastIndex', () => {
    it('should find last index of substr', () => {
      expect(LastIndex('hello world hello', 'hello')).toBe(12)
      expect(LastIndex('hello world', 'xyz')).toBe(-1)
      expect(LastIndex('hello', 'hello')).toBe(0)
    })
  })

  describe('LastIndexAny', () => {
    it('should find last index of any char from chars', () => {
      expect(LastIndexAny('hello', 'aeiou')).toBe(4) // 'o'
      expect(LastIndexAny('hello', 'xyz')).toBe(-1)
      expect(LastIndexAny('', 'abc')).toBe(-1)
    })
  })

  describe('LastIndexByte', () => {
    it('should find last index of byte', () => {
      expect(LastIndexByte('hello', 108)).toBe(3) // 'l'
      expect(LastIndexByte('hello', 120)).toBe(-1) // 'x'
      expect(LastIndexByte('', 97)).toBe(-1) // 'a'
    })
  })

  describe('LastIndexFunc', () => {
    it('should find last index where predicate is true', () => {
      expect(LastIndexFunc('hello', (r) => r === 108)).toBe(3) // 'l'
      expect(LastIndexFunc('hello', (r) => r === 120)).toBe(-1) // 'x'
      expect(LastIndexFunc('', () => true)).toBe(-1)
      expect(LastIndexFunc('abc', null)).toBe(-1)
    })
  })

  describe('Map', () => {
    it('should apply mapping function to each rune', () => {
      expect(Map((r) => r + 1, 'abc')).toBe('bcd')
      expect(Map(() => 65, 'hello')).toBe('AAAAA') // all to 'A'
      expect(Map(null, 'hello')).toBe('hello')
      expect(Map((r) => r, '')).toBe('')
    })
  })

  describe('Repeat', () => {
    it('should repeat string count times', () => {
      expect(Repeat('abc', 3)).toBe('abcabcabc')
      expect(Repeat('hello', 0)).toBe('')
      expect(Repeat('', 5)).toBe('')
      expect(() => Repeat('abc', -1)).toThrow()
    })
  })

  describe('Replace', () => {
    it('should replace first n instances of old with new', () => {
      expect(Replace('hello world hello', 'hello', 'hi', 1)).toBe(
        'hi world hello',
      )
      expect(Replace('hello world hello', 'hello', 'hi', 2)).toBe('hi world hi')
      expect(Replace('hello world', 'xyz', 'abc', 1)).toBe('hello world')
      expect(Replace('hello', '', 'x', 1)).toBe('hello')
    })
  })

  describe('ReplaceAll', () => {
    it('should replace all instances of old with new', () => {
      expect(ReplaceAll('hello world hello', 'hello', 'hi')).toBe('hi world hi')
      expect(ReplaceAll('hello world', 'xyz', 'abc')).toBe('hello world')
      expect(ReplaceAll('hello', '', 'x')).toBe('hello')
    })
  })

  describe('Split', () => {
    it('should split string by separator', () => {
      const result = Split('a,b,c', ',')
      expect($.asArray(result)).toEqual(['a', 'b', 'c'])

      const empty = Split('', ',')
      expect($.asArray(empty)).toEqual([''])

      const explode = Split('abc', '')
      expect($.asArray(explode)).toEqual(['a', 'b', 'c'])
    })
  })

  describe('SplitAfter', () => {
    it('should split after each instance of sep', () => {
      const result = SplitAfter('a,b,c', ',')
      expect($.asArray(result)).toEqual(['a,', 'b,', 'c'])

      const noSep = SplitAfter('abc', ',')
      expect($.asArray(noSep)).toEqual(['abc'])
    })
  })

  describe('SplitAfterN', () => {
    it('should split after each instance of sep up to n times', () => {
      const result = SplitAfterN('a,b,c,d', ',', 2)
      expect($.asArray(result)).toEqual(['a,', 'b,c,d'])

      const zero = SplitAfterN('a,b,c', ',', 0)
      expect($.asArray(zero)).toEqual([])
    })
  })

  describe('SplitN', () => {
    it('should split string by separator up to n times', () => {
      const result = SplitN('a,b,c,d', ',', 2)
      expect($.asArray(result)).toEqual(['a', 'b,c,d'])

      const zero = SplitN('a,b,c', ',', 0)
      expect($.asArray(zero)).toEqual([])

      const one = SplitN('a,b,c', ',', 1)
      expect($.asArray(one)).toEqual(['a,b,c'])
    })
  })

  describe('Title', () => {
    it('should convert to title case', () => {
      expect(Title('hello world')).toBe('Hello World')
      expect(Title('HELLO WORLD')).toBe('Hello World')
      expect(Title('')).toBe('')
    })
  })

  describe('ToLower', () => {
    it('should convert to lowercase', () => {
      expect(ToLower('HELLO WORLD')).toBe('hello world')
      expect(ToLower('Hello World')).toBe('hello world')
      expect(ToLower('')).toBe('')
    })
  })

  describe('ToTitle', () => {
    it('should convert to title case', () => {
      expect(ToTitle('hello world')).toBe('Hello World')
      expect(ToTitle('HELLO WORLD')).toBe('Hello World')
      expect(ToTitle('')).toBe('')
    })
  })

  describe('ToUpper', () => {
    it('should convert to uppercase', () => {
      expect(ToUpper('hello world')).toBe('HELLO WORLD')
      expect(ToUpper('Hello World')).toBe('HELLO WORLD')
      expect(ToUpper('')).toBe('')
    })
  })

  describe('Trim', () => {
    it('should trim cutset from both ends', () => {
      expect(Trim('!hello!', '!')).toBe('hello')
      expect(Trim('   hello   ', ' ')).toBe('hello')
      expect(Trim('hello', 'x')).toBe('hello')
      expect(Trim('', 'x')).toBe('')
    })
  })

  describe('TrimFunc', () => {
    it('should trim runes satisfying predicate from both ends', () => {
      expect(TrimFunc('   hello   ', (r) => r === 32)).toBe('hello') // space
      expect(TrimFunc('hello', (r) => r === 120)).toBe('hello') // 'x'
      expect(TrimFunc('', () => true)).toBe('')
      expect(TrimFunc('abc', null)).toBe('abc')
    })
  })

  describe('TrimLeft', () => {
    it('should trim cutset from left end', () => {
      expect(TrimLeft('!hello!', '!')).toBe('hello!')
      expect(TrimLeft('   hello   ', ' ')).toBe('hello   ')
      expect(TrimLeft('hello', 'x')).toBe('hello')
    })
  })

  describe('TrimLeftFunc', () => {
    it('should trim runes satisfying predicate from left end', () => {
      expect(TrimLeftFunc('   hello   ', (r) => r === 32)).toBe('hello   ') // space
      expect(TrimLeftFunc('hello', (r) => r === 120)).toBe('hello') // 'x'
      expect(TrimLeftFunc('abc', null)).toBe('abc')
    })
  })

  describe('TrimPrefix', () => {
    it('should remove prefix if present', () => {
      expect(TrimPrefix('hello world', 'hello ')).toBe('world')
      expect(TrimPrefix('hello world', 'hi ')).toBe('hello world')
      expect(TrimPrefix('', '')).toBe('')
    })
  })

  describe('TrimRight', () => {
    it('should trim cutset from right end', () => {
      expect(TrimRight('!hello!', '!')).toBe('!hello')
      expect(TrimRight('   hello   ', ' ')).toBe('   hello')
      expect(TrimRight('hello', 'x')).toBe('hello')
    })
  })

  describe('TrimRightFunc', () => {
    it('should trim runes satisfying predicate from right end', () => {
      expect(TrimRightFunc('   hello   ', (r) => r === 32)).toBe('   hello') // space
      expect(TrimRightFunc('hello', (r) => r === 120)).toBe('hello') // 'x'
      expect(TrimRightFunc('abc', null)).toBe('abc')
    })
  })

  describe('TrimSpace', () => {
    it('should trim whitespace from both ends', () => {
      expect(TrimSpace('   hello   ')).toBe('hello')
      expect(TrimSpace('\t\nhello\r\n')).toBe('hello')
      expect(TrimSpace('hello')).toBe('hello')
      expect(TrimSpace('')).toBe('')
    })
  })

  describe('TrimSuffix', () => {
    it('should remove suffix if present', () => {
      expect(TrimSuffix('hello world', ' world')).toBe('hello')
      expect(TrimSuffix('hello world', ' universe')).toBe('hello world')
      expect(TrimSuffix('', '')).toBe('')
    })
  })
})
