import { describe, it, expect } from 'vitest'
import {
  Base,
  Dir,
  Ext,
  Clean,
  Join,
  Split,
  IsAbs,
  ToSlash,
  FromSlash,
  VolumeName,
  IsLocal,
  SplitList,
  HasPrefix,
  Abs,
  Rel,
  EvalSymlinks,
  Separator,
  ListSeparator,
} from './path.js'

describe('path/filepath - Path manipulation functions', () => {
  describe('Base', () => {
    it('should return the last element of path', () => {
      expect(Base('dir/subdir/file.txt')).toBe('file.txt')
      expect(Base('/usr/bin/ls')).toBe('ls')
      expect(Base('file.txt')).toBe('file.txt')
      expect(Base('/')).toBe('/')
      expect(Base('')).toBe('.')
      expect(Base('//')).toBe('/')
      expect(Base('dir/')).toBe('dir')
      expect(Base('dir//')).toBe('dir')
    })
  })

  describe('Dir', () => {
    it('should return directory portion of path', () => {
      expect(Dir('dir/subdir/file.txt')).toBe('dir/subdir')
      expect(Dir('/usr/bin/ls')).toBe('/usr/bin')
      expect(Dir('file.txt')).toBe('.')
      expect(Dir('/')).toBe('/')
      expect(Dir('')).toBe('.')
      expect(Dir('/file')).toBe('/')
      expect(Dir('dir/')).toBe('.')
    })
  })

  describe('Ext', () => {
    it('should return file extension', () => {
      expect(Ext('file.txt')).toBe('.txt')
      expect(Ext('file.tar.gz')).toBe('.gz')
      expect(Ext('file')).toBe('')
      expect(Ext('.hidden')).toBe('')
      expect(Ext('dir/file.txt')).toBe('.txt')
      expect(Ext('')).toBe('')
    })
  })

  describe('Clean', () => {
    it('should clean up path by resolving . and .. elements', () => {
      expect(Clean('dir//subdir/../subdir/./file.txt')).toBe(
        'dir/subdir/file.txt',
      )
      expect(Clean('/dir/../file')).toBe('/file')
      expect(Clean('./file')).toBe('file')
      expect(Clean('../file')).toBe('../file')
      expect(Clean('dir/..')).toBe('.')
      expect(Clean('/dir/..')).toBe('/')
      expect(Clean('')).toBe('.')
      expect(Clean('/')).toBe('/')
      expect(Clean('///')).toBe('/')
    })
  })

  describe('Join', () => {
    it('should join path elements with separator', () => {
      expect(Join('dir', 'subdir', 'file.txt')).toBe('dir/subdir/file.txt')
      expect(Join('/usr', 'bin', 'ls')).toBe('/usr/bin/ls')
      expect(Join('', 'file')).toBe('file')
      expect(Join('dir', '', 'file')).toBe('dir/file')
      expect(Join()).toBe('')
      expect(Join('', '', '')).toBe('')
    })
  })

  describe('Split', () => {
    it('should split path into directory and file', () => {
      expect(Split('dir/subdir/file.txt')).toEqual(['dir/subdir/', 'file.txt'])
      expect(Split('/usr/bin/ls')).toEqual(['/usr/bin/', 'ls'])
      expect(Split('file.txt')).toEqual(['', 'file.txt'])
      expect(Split('/')).toEqual(['/', ''])
      expect(Split('')).toEqual(['', ''])
    })
  })

  describe('IsAbs', () => {
    it('should check if path is absolute', () => {
      expect(IsAbs('/absolute/path')).toBe(true)
      expect(IsAbs('relative/path')).toBe(false)
      expect(IsAbs('/')).toBe(true)
      expect(IsAbs('')).toBe(false)
      expect(IsAbs('./relative')).toBe(false)
    })
  })

  describe('ToSlash', () => {
    it('should preserve path on Unix systems (backslashes are regular chars)', () => {
      // On Unix systems, ToSlash doesn't convert backslashes because they're not separators
      expect(ToSlash('dir\\subdir\\file.txt')).toBe('dir\\subdir\\file.txt')
      expect(ToSlash('dir/subdir/file.txt')).toBe('dir/subdir/file.txt')
      expect(ToSlash('')).toBe('')
    })
  })

  describe('FromSlash', () => {
    it('should preserve path on Unix systems', () => {
      // On Unix systems, FromSlash doesn't change anything because separator is already '/'
      expect(FromSlash('dir/subdir/file.txt')).toBe('dir/subdir/file.txt')
      expect(FromSlash('')).toBe('')
    })
  })

  describe('VolumeName', () => {
    it('should return empty string on Unix systems', () => {
      expect(VolumeName('C:\\Windows\\System32')).toBe('')
      expect(VolumeName('/usr/local')).toBe('')
      expect(VolumeName('')).toBe('')
    })
  })

  describe('IsLocal', () => {
    it('should check if path is local (not escaping)', () => {
      expect(IsLocal('file.txt')).toBe(true)
      expect(IsLocal('dir/file.txt')).toBe(true)
      expect(IsLocal('../file.txt')).toBe(false)
      expect(IsLocal('/absolute/path')).toBe(false)
      expect(IsLocal('')).toBe(false)
      expect(IsLocal('dir/../file')).toBe(true)
      expect(IsLocal('dir/../../file')).toBe(false)
    })
  })

  describe('SplitList', () => {
    it('should split PATH-style lists', () => {
      expect(SplitList('/usr/bin:/usr/local/bin:/bin')).toEqual([
        '/usr/bin',
        '/usr/local/bin',
        '/bin',
      ])
      expect(SplitList('')).toEqual([])
      expect(SplitList('/single/path')).toEqual(['/single/path'])
      expect(SplitList('a:b:c')).toEqual(['a', 'b', 'c'])
    })
  })

  describe('HasPrefix', () => {
    it('should check if path has prefix', () => {
      expect(HasPrefix('/usr/local/bin', '/usr/local')).toBe(true)
      expect(HasPrefix('/usr/local', '/usr/local')).toBe(true)
      expect(HasPrefix('/usr/local/bin', '/usr/bin')).toBe(false)
      expect(HasPrefix('relative/path', 'relative')).toBe(true)
      expect(HasPrefix('file.txt', '')).toBe(true)
      expect(HasPrefix('', 'prefix')).toBe(false)
    })
  })

  describe('Abs', () => {
    it('should handle absolute paths', () => {
      const [result1, err1] = Abs('/absolute/path')
      expect(err1).toBeNull()
      expect(result1).toBe('/absolute/path')

      const [result2, err2] = Abs('relative/path')
      expect(err2).toBeNull()
      expect(result2).toBe('/relative/path')
    })
  })

  describe('Rel', () => {
    it('should calculate relative path', () => {
      const [result1, err1] = Rel('/usr/local', '/usr/local')
      expect(err1).toBeNull()
      expect(result1).toBe('.')

      const [result2, err2] = Rel('/usr/local', '/usr/local/bin')
      expect(err2).toBeNull()
      expect(result2).toBe('bin')

      const [result3, err3] = Rel('/usr/local', '/other/path')
      expect(err3).toBeNull()
      expect(result3).toBe('/other/path')
    })
  })

  describe('EvalSymlinks', () => {
    it('should return cleaned path (stubbed)', () => {
      const [result, err] = EvalSymlinks('/path/with/../dots')
      expect(err).toBeNull()
      expect(result).toBe('/path/dots')
    })
  })

  describe('Constants', () => {
    it('should have correct separator constants', () => {
      expect(Separator).toBe(47)
      expect(ListSeparator).toBe(58)
    })
  })
})

describe('Complex path operations', () => {
  it('should handle edge cases correctly', () => {
    // Test Clean with complex paths
    expect(Clean('/a/b/../c/./d/')).toBe('/a/c/d')
    expect(Clean('a/b/../../c')).toBe('c')
    expect(Clean('../../a/b')).toBe('../../a/b')

    // Test Join with various inputs
    expect(Join('/a', '../b', 'c')).toBe('/b/c')
    expect(Join('a', '/b', 'c')).toBe('/b/c')

    // Test Split edge cases
    expect(Split('/a/')).toEqual(['/a/', ''])
    expect(Split('//a')).toEqual(['//', 'a'])
  })

  it('should maintain path consistency', () => {
    const testPaths = [
      'simple/path',
      '/absolute/path',
      'path/with/../dots',
      './relative/path',
      '../../parent/path',
    ]

    for (const path of testPaths) {
      const cleaned = Clean(path)
      const [dir, file] = Split(cleaned)
      const rejoined = dir + file

      // Split and rejoin should preserve the cleaned path
      expect(rejoined).toBe(cleaned)
    }
  })
})
