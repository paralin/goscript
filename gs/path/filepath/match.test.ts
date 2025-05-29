import { describe, it, expect } from 'vitest'
import { Match, Glob, ErrBadPattern } from './match.js'

describe('path/filepath - Pattern matching functions', () => {
  describe('Match', () => {
    describe('Basic patterns', () => {
      it('should match exact strings', () => {
        const [matched, err] = Match('file.txt', 'file.txt')
        expect(err).toBeNull()
        expect(matched).toBe(true)

        const [notMatched, err2] = Match('file.txt', 'other.txt')
        expect(err2).toBeNull()
        expect(notMatched).toBe(false)
      })

      it('should handle empty patterns and names', () => {
        const [empty1, err1] = Match('', '')
        expect(err1).toBeNull()
        expect(empty1).toBe(true)

        const [empty2, err2] = Match('', 'file')
        expect(err2).toBeNull()
        expect(empty2).toBe(false)

        const [empty3, err3] = Match('pattern', '')
        expect(err3).toBeNull()
        expect(empty3).toBe(false)
      })
    })

    describe('Wildcard patterns', () => {
      it('should match with * (star)', () => {
        const [match1, err1] = Match('*.txt', 'file.txt')
        expect(err1).toBeNull()
        expect(match1).toBe(true)

        const [match2, err2] = Match('*.txt', 'file.doc')
        expect(err2).toBeNull()
        expect(match2).toBe(false)

        const [match3, err3] = Match('file.*', 'file.txt')
        expect(err3).toBeNull()
        expect(match3).toBe(true)

        const [match4, err4] = Match('*', 'anything')
        expect(err4).toBeNull()
        expect(match4).toBe(true)

        const [match5, err5] = Match('*', '')
        expect(err5).toBeNull()
        expect(match5).toBe(true)
      })

      it('should match with ? (question mark)', () => {
        const [match1, err1] = Match('file?.txt', 'file1.txt')
        expect(err1).toBeNull()
        expect(match1).toBe(true)

        const [match2, err2] = Match('file?.txt', 'fileAB.txt')
        expect(err2).toBeNull()
        expect(match2).toBe(false)

        const [match3, err3] = Match('?', 'a')
        expect(err3).toBeNull()
        expect(match3).toBe(true)

        const [match4, err4] = Match('?', '')
        expect(err4).toBeNull()
        expect(match4).toBe(false)

        const [match5, err5] = Match('?', 'ab')
        expect(err5).toBeNull()
        expect(match5).toBe(false)
      })
    })

    describe('Character classes', () => {
      it('should match character ranges', () => {
        const [match1, err1] = Match('[a-z]', 'c')
        expect(err1).toBeNull()
        expect(match1).toBe(true)

        const [match2, err2] = Match('[a-z]', 'Z')
        expect(err2).toBeNull()
        expect(match2).toBe(false)

        const [match3, err3] = Match('[0-9]', '5')
        expect(err3).toBeNull()
        expect(match3).toBe(true)
      })

      it('should match specific characters', () => {
        const [match1, err1] = Match('[abc]', 'b')
        expect(err1).toBeNull()
        expect(match1).toBe(true)

        const [match2, err2] = Match('[abc]', 'd')
        expect(err2).toBeNull()
        expect(match2).toBe(false)
      })

      it('should handle negated character classes', () => {
        const [match1, err1] = Match('[^abc]', 'd')
        expect(err1).toBeNull()
        expect(match1).toBe(true)

        const [match2, err2] = Match('[^abc]', 'a')
        expect(err2).toBeNull()
        expect(match2).toBe(false)

        const [match3, err3] = Match('[^a-z]', '1')
        expect(err3).toBeNull()
        expect(match3).toBe(true)

        const [match4, err4] = Match('[^a-z]', 'c')
        expect(err4).toBeNull()
        expect(match4).toBe(false)
      })
    })

    describe('Escaped characters', () => {
      it('should handle escaped special characters', () => {
        const [match1, err1] = Match('\\*', '*')
        expect(err1).toBeNull()
        expect(match1).toBe(true)

        const [match2, err2] = Match('\\?', '?')
        expect(err2).toBeNull()
        expect(match2).toBe(true)

        const [match3, err3] = Match('\\[', '[')
        expect(err3).toBeNull()
        expect(match3).toBe(true)
      })

      it('should handle escaped characters in character classes', () => {
        const [match1, err1] = Match('[\\-]', '-')
        expect(err1).toBeNull()
        expect(match1).toBe(true)

        const [match2, err2] = Match('[\\]]', ']')
        expect(err2).toBeNull()
        expect(match2).toBe(true)
      })
    })

    describe('Complex patterns', () => {
      it('should match complex combinations', () => {
        const [match1, err1] = Match('dir/*', 'dir/file.txt')
        expect(err1).toBeNull()
        expect(match1).toBe(true)

        const [match2, err2] = Match('*.{txt,doc}', 'file.txt')
        expect(err2).toBeNull()
        // This pattern is not supported in our implementation, should not match
        expect(match2).toBe(false)

        const [match3, err3] = Match('file[0-9].txt', 'file5.txt')
        expect(err3).toBeNull()
        expect(match3).toBe(true)

        const [match4, err4] = Match('*.[tT][xX][tT]', 'file.TXT')
        expect(err4).toBeNull()
        expect(match4).toBe(true)
      })

      it('should not match across path separators with ?', () => {
        const [match1, err1] = Match('dir?file', 'dir/file')
        expect(err1).toBeNull()
        expect(match1).toBe(false)
      })
    })

    describe('Error cases', () => {
      it('should return error for malformed patterns', () => {
        const [_unclosed, err1] = Match('[unclosed', 'test')
        expect(err1).toBe(ErrBadPattern)

        const [_trailing, err2] = Match('trailing\\', 'test')
        expect(err2).toBe(ErrBadPattern)

        const [_bracket, err3] = Match('[', 'test')
        expect(err3).toBe(ErrBadPattern)
      })
    })

    describe('Real-world examples', () => {
      it('should match common file patterns', () => {
        // JavaScript files
        const [js1, _js1] = Match('*.js', 'app.js')
        expect(js1).toBe(true)

        const [js2, _js2] = Match('*.js', 'app.jsx')
        expect(js2).toBe(false)

        // Backup files
        const [bak1, _bak1] = Match('*.bak', 'file.txt.bak')
        expect(bak1).toBe(true)

        // Hidden files
        const [hidden1, _hidden1] = Match('.*', '.hidden')
        expect(hidden1).toBe(true)

        const [hidden2, _hidden2] = Match('.*', 'visible')
        expect(hidden2).toBe(false)

        // Version numbers
        const [ver1, _ver1] = Match('v[0-9]*', 'v1.2.3')
        expect(ver1).toBe(true)

        const [ver2, _ver2] = Match('v[0-9]*', 'version')
        expect(ver2).toBe(false)
      })
    })
  })

  describe('Glob', () => {
    it('should validate patterns but return empty results (no filesystem)', () => {
      // Valid patterns should not error
      const [files1, err1] = Glob('*.txt')
      expect(err1).toBeNull()
      expect(files1).toEqual([])

      const [files2, err2] = Glob('dir/*')
      expect(err2).toBeNull()
      expect(files2).toEqual([])

      // Invalid patterns should error
      const [files3, err3] = Glob('[unclosed')
      expect(err3).toBe(ErrBadPattern)
      expect(files3).toEqual([])
    })
  })

  describe('Pattern edge cases', () => {
    it('should handle patterns at string boundaries', () => {
      const [match1, _edge1] = Match('*txt', 'file.txt')
      expect(match1).toBe(true)

      const [match2, _edge2] = Match('file*', 'file.txt')
      expect(match2).toBe(true)

      const [match3, _edge3] = Match('*file*', 'myfile.txt')
      expect(match3).toBe(true)
    })

    it('should handle multiple stars', () => {
      const [match1, _star1] = Match('**', 'anything')
      expect(match1).toBe(true)

      const [match2, _star2] = Match('*.*.*', 'a.b.c')
      expect(match2).toBe(true)

      const [match3, _star3] = Match('*.*.*', 'a.b')
      expect(match3).toBe(false)
    })

    it('should handle character class edge cases', () => {
      // Empty character class (should be invalid)
      const [_empty, err1] = Match('[]', 'test')
      expect(err1).toBe(ErrBadPattern)

      // Character class with dash
      const [match1, err2] = Match('[a-]', 'a')
      expect(err2).toBeNull()
      expect(match1).toBe(true)

      const [match2, err3] = Match('[a-]', '-')
      expect(err3).toBeNull()
      expect(match2).toBe(true)
    })
  })
})
