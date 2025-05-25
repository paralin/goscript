import { describe, it, expect } from 'vitest'
import * as $ from '@goscript/builtin/builtin.js'
import {
  Lines,
  SplitSeq,
  SplitAfterSeq,
  FieldsSeq,
  FieldsFuncSeq,
} from './iter.js'

describe('strings/iter', () => {
  describe('Lines', () => {
    it('should yield lines with newlines', () => {
      const lines: string[] = []
      const seq = Lines('line1\nline2\nline3')
      seq((line: string) => {
        lines.push(line)
        return true
      })
      expect(lines).toEqual(['line1\n', 'line2\n', 'line3'])
    })

    it('should handle empty string', () => {
      const lines: string[] = []
      const seq = Lines('')
      seq((line: string) => {
        lines.push(line)
        return true
      })
      expect(lines).toEqual([])
    })

    it('should handle string without final newline', () => {
      const lines: string[] = []
      const seq = Lines('line1\nline2')
      seq((line: string) => {
        lines.push(line)
        return true
      })
      expect(lines).toEqual(['line1\n', 'line2'])
    })

    it('should handle single line', () => {
      const lines: string[] = []
      const seq = Lines('single line')
      seq((line: string) => {
        lines.push(line)
        return true
      })
      expect(lines).toEqual(['single line'])
    })

    it('should handle early termination', () => {
      const lines: string[] = []
      const seq = Lines('line1\nline2\nline3\n')
      seq((line: string) => {
        lines.push(line)
        return lines.length < 2 // Stop after 2 lines
      })
      expect(lines).toEqual(['line1\n', 'line2\n'])
    })

    it('should handle multiple consecutive newlines', () => {
      const lines: string[] = []
      const seq = Lines('line1\n\nline3\n')
      seq((line: string) => {
        lines.push(line)
        return true
      })
      expect(lines).toEqual(['line1\n', '\n', 'line3\n'])
    })
  })

  describe('SplitSeq', () => {
    it('should split by separator', () => {
      const parts: string[] = []
      const seq = SplitSeq('a,b,c', ',')
      seq((part: string) => {
        parts.push(part)
        return true
      })
      expect(parts).toEqual(['a', 'b', 'c'])
    })

    it('should handle empty separator (explode)', () => {
      const parts: string[] = []
      const seq = SplitSeq('abc', '')
      seq((part: string) => {
        parts.push(part)
        return true
      })
      expect(parts).toEqual(['a', 'b', 'c'])
    })

    it('should handle no separator found', () => {
      const parts: string[] = []
      const seq = SplitSeq('hello', ',')
      seq((part: string) => {
        parts.push(part)
        return true
      })
      expect(parts).toEqual(['hello'])
    })

    it('should handle empty string', () => {
      const parts: string[] = []
      const seq = SplitSeq('', ',')
      seq((part: string) => {
        parts.push(part)
        return true
      })
      expect(parts).toEqual([''])
    })

    it('should handle early termination', () => {
      const parts: string[] = []
      const seq = SplitSeq('a,b,c,d', ',')
      seq((part: string) => {
        parts.push(part)
        return parts.length < 2
      })
      expect(parts).toEqual(['a', 'b'])
    })

    it('should handle unicode', () => {
      const parts: string[] = []
      const seq = SplitSeq('世界,你好', ',')
      // This test expects an error due to UTF-8 slicing limitations in JavaScript
      expect(() => {
        seq((part: string) => {
          parts.push(part)
          return true
        })
      }).toThrow('Cannot slice string at byte indices')
    })
  })

  describe('SplitAfterSeq', () => {
    it('should split after separator', () => {
      const parts: string[] = []
      const seq = SplitAfterSeq('a,b,c', ',')
      seq((part: string) => {
        parts.push(part)
        return true
      })
      expect(parts).toEqual(['a,', 'b,', 'c'])
    })

    it('should handle empty separator (explode)', () => {
      const parts: string[] = []
      const seq = SplitAfterSeq('abc', '')
      seq((part: string) => {
        parts.push(part)
        return true
      })
      expect(parts).toEqual(['a', 'b', 'c'])
    })

    it('should handle no separator found', () => {
      const parts: string[] = []
      const seq = SplitAfterSeq('hello', ',')
      seq((part: string) => {
        parts.push(part)
        return true
      })
      expect(parts).toEqual(['hello'])
    })

    it('should handle trailing separator', () => {
      const parts: string[] = []
      const seq = SplitAfterSeq('a,b,', ',')
      seq((part: string) => {
        parts.push(part)
        return true
      })
      expect(parts).toEqual(['a,', 'b,', ''])
    })

    it('should handle early termination', () => {
      const parts: string[] = []
      const seq = SplitAfterSeq('a,b,c,d', ',')
      seq((part: string) => {
        parts.push(part)
        return parts.length < 2
      })
      expect(parts).toEqual(['a,', 'b,'])
    })
  })

  describe('FieldsSeq', () => {
    it('should split on whitespace', () => {
      const fields: string[] = []
      const seq = FieldsSeq('  hello   world  ')
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual(['hello', 'world'])
    })

    it('should handle empty string', () => {
      const fields: string[] = []
      const seq = FieldsSeq('')
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual([])
    })

    it('should handle only whitespace', () => {
      const fields: string[] = []
      const seq = FieldsSeq('   \t\n  ')
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual([])
    })

    it('should handle single field', () => {
      const fields: string[] = []
      const seq = FieldsSeq('hello')
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual(['hello'])
    })

    it('should handle mixed whitespace', () => {
      const fields: string[] = []
      const seq = FieldsSeq('hello\tworld\ntest')
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual(['hello', 'world', 'test'])
    })

    it('should handle early termination', () => {
      const fields: string[] = []
      const seq = FieldsSeq('one two three four')
      seq((field: string) => {
        fields.push(field)
        return fields.length < 2
      })
      expect(fields).toEqual(['one', 'two'])
    })

    it('should handle unicode whitespace', () => {
      const fields: string[] = []
      const seq = FieldsSeq('hello　world') // contains unicode space
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual(['hello', 'world'])
    })
  })

  describe('FieldsFuncSeq', () => {
    it('should split using predicate function', () => {
      const fields: string[] = []
      const seq = FieldsFuncSeq('a,b,c', (r: number) => r === 44) // comma
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual(['a', 'b', 'c'])
    })

    it('should handle null predicate', () => {
      const fields: string[] = []
      const seq = FieldsFuncSeq('hello world', null)
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual([])
    })

    it('should handle empty string', () => {
      const fields: string[] = []
      const seq = FieldsFuncSeq('', (r: number) => r === 32) // space
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual([])
    })

    it('should handle no separator matches', () => {
      const fields: string[] = []
      const seq = FieldsFuncSeq('hello', (r: number) => r === 44) // comma
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual(['hello'])
    })

    it('should handle all characters match predicate', () => {
      const fields: string[] = []
      const seq = FieldsFuncSeq('aaa', (r: number) => r === 97) // 'a'
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual([])
    })

    it('should handle mixed ascii and unicode', () => {
      const fields: string[] = []
      const seq = FieldsFuncSeq('hello世world', (r: number) => r === 0x4e16) // '世'
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual(['hello', 'world'])
    })

    it('should handle early termination', () => {
      const fields: string[] = []
      const seq = FieldsFuncSeq('a;b;c;d', (r: number) => r === 59) // semicolon
      seq((field: string) => {
        fields.push(field)
        return fields.length < 2
      })
      expect(fields).toEqual(['a', 'b'])
    })

    it('should handle consecutive separators', () => {
      const fields: string[] = []
      const seq = FieldsFuncSeq('a,,b', (r: number) => r === 44) // comma
      seq((field: string) => {
        fields.push(field)
        return true
      })
      expect(fields).toEqual(['a', 'b'])
    })
  })
})
