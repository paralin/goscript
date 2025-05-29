// Package filepath implements utility routines for manipulating filename paths
// in a way compatible with the target operating system-defined file paths.

// Path separator constants
export const Separator = '/'
export const ListSeparator = ':'

// Error constants
export const SkipDir = new Error('skip this directory')
export const SkipAll = new Error('skip everything and stop the walk')

// Base returns the last element of path.
// Trailing path separators are removed before extracting the last element.
// If the path is empty, Base returns ".".
// If the path consists entirely of separators, Base returns a single separator.
export function Base(path: string): string {
  if (path === '') {
    return '.'
  }

  // Strip trailing slashes
  path = path.replace(/\/+$/, '')

  if (path === '') {
    return '/'
  }

  // Find the last slash
  const i = path.lastIndexOf('/')
  if (i >= 0) {
    return path.substring(i + 1)
  }

  return path
}

// Dir returns all but the last element of path, typically the path's directory.
// After dropping the final element, Dir calls Clean on the path and trailing
// slashes are removed. If the path is empty, Dir returns ".".
// If the path consists entirely of separators, Dir returns a single separator.
export function Dir(path: string): string {
  if (path === '') {
    return '.'
  }

  // Strip trailing slashes
  path = path.replace(/\/+$/, '')

  if (path === '') {
    return '/'
  }

  // Find the last slash
  const i = path.lastIndexOf('/')
  if (i >= 0) {
    const dir = path.substring(0, i)
    return Clean(dir === '' ? '/' : dir)
  }

  return '.'
}

// Ext returns the file name extension used by path.
// The extension is the suffix beginning at the final dot
// in the final element of path; it is empty if there is no dot.
export function Ext(path: string): string {
  const base = Base(path)

  // Handle special case: if the base starts with a dot and has no other dots,
  // it's a hidden file with no extension
  if (base.startsWith('.') && base.indexOf('.', 1) === -1) {
    return ''
  }

  const i = base.lastIndexOf('.')
  if (i >= 0) {
    return base.substring(i)
  }
  return ''
}

// Clean returns the shortest path name equivalent to path
// by purely lexical processing.
export function Clean(path: string): string {
  if (path === '') {
    return '.'
  }

  const isAbs = path.startsWith('/')
  const segments = path
    .split('/')
    .filter((segment) => segment !== '' && segment !== '.')
  const result: string[] = []

  for (const segment of segments) {
    if (segment === '..') {
      if (result.length > 0 && result[result.length - 1] !== '..') {
        result.pop()
      } else if (!isAbs) {
        result.push('..')
      }
    } else {
      result.push(segment)
    }
  }

  let cleaned = result.join('/')
  if (isAbs) {
    cleaned = '/' + cleaned
  }

  return (
    cleaned === '' ?
      isAbs ? '/'
      : '.'
    : cleaned
  )
}

// Join joins any number of path elements into a single path,
// separating them with an OS specific Separator. Empty elements
// are ignored. The result is Cleaned. However, if the argument
// list is empty or all its elements are empty, Join returns
// an empty string.
export function Join(...elem: string[]): string {
  if (elem.length === 0) {
    return ''
  }

  // Filter out empty elements but handle absolute paths
  const parts: string[] = []

  for (const e of elem) {
    if (e === '') {
      continue
    }

    // If this element is absolute, start over from here
    if (IsAbs(e)) {
      parts.length = 0 // Clear previous parts
      parts.push(e)
    } else {
      parts.push(e)
    }
  }

  if (parts.length === 0) {
    return ''
  }

  return Clean(parts.join('/'))
}

// Split splits path immediately following the final Separator,
// separating it into a directory and file name component.
// If there is no Separator in path, Split returns an empty dir
// and file set to path. The returned values have the property
// that path = dir+file.
export function Split(path: string): [string, string] {
  const i = path.lastIndexOf('/')
  if (i < 0) {
    return ['', path]
  }
  return [path.substring(0, i + 1), path.substring(i + 1)]
}

// IsAbs reports whether the path is absolute.
export function IsAbs(path: string): boolean {
  return path.startsWith('/')
}

// ToSlash returns the result of replacing each separator character
// in path with a slash ('/') character. Multiple separators are
// replaced by multiple slashes.
export function ToSlash(path: string): string {
  // On Unix-like systems (including our JS environment), the separator is already '/'
  // so backslashes are just regular characters and should not be converted
  // This matches Go's behavior on Unix systems
  return path
}

// FromSlash returns the result of replacing each slash ('/') character
// in path with a separator character. Multiple slashes are replaced
// by multiple separators.
export function FromSlash(path: string): string {
  // On Unix-like systems (including our JS environment), separator is '/'
  // so no conversion needed
  return path
}

// VolumeName returns leading volume name.
// Given "C:\foo\bar" it returns "C:" on Windows.
// Given "\\host\share\foo" it returns "\\host\share".
// On other systems, it returns "".
export function VolumeName(_path: string): string {
  // In our JS environment, we don't have volume names
  return ''
}

// IsLocal reports whether path, using lexical analysis only,
// has all of these properties:
//   - is within the subtree rooted at the directory in which path is evaluated
//   - is not an absolute path
//   - is not empty
//   - on Windows, is not a reserved name such as "NUL"
export function IsLocal(path: string): boolean {
  if (path === '' || IsAbs(path)) {
    return false
  }

  // Check for .. components that would escape
  const segments = path.split('/')
  let depth = 0

  for (const segment of segments) {
    if (segment === '..') {
      depth--
      if (depth < 0) {
        return false
      }
    } else if (segment !== '.' && segment !== '') {
      depth++
    }
  }

  return true
}

// SplitList splits a list of paths joined by the OS-specific ListSeparator,
// usually found in PATH or GOPATH environment variables.
// Unlike strings.Split, SplitList returns an empty slice when passed an empty string.
export function SplitList(path: string): string[] {
  if (path === '') {
    return []
  }
  return path.split(ListSeparator)
}

// HasPrefix tests whether the path p begins with prefix.
export function HasPrefix(p: string, prefix: string): boolean {
  if (prefix === '') {
    return true
  }

  // Normalize both paths
  const normalP = Clean(p)
  const normalPrefix = Clean(prefix)

  if (normalP === normalPrefix) {
    return true
  }

  // Check if p starts with prefix followed by a separator
  if (normalP.startsWith(normalPrefix)) {
    const remaining = normalP.substring(normalPrefix.length)
    return remaining.startsWith('/')
  }

  return false
}

// Stubs for functions that require filesystem operations
// These are simplified implementations for compatibility

export function Abs(path: string): [string, Error | null] {
  if (IsAbs(path)) {
    return [Clean(path), null]
  }
  // In a real implementation, this would resolve relative to current working directory
  // For our purposes, we'll just prepend a fake absolute path
  return ['/' + Clean(path), null]
}

export function Rel(
  basepath: string,
  targpath: string,
): [string, Error | null] {
  // Simplified implementation - in reality this is much more complex
  const base = Clean(basepath)
  const targ = Clean(targpath)

  if (base === targ) {
    return ['.', null]
  }

  // Very basic relative path calculation
  if (targ.startsWith(base + '/')) {
    return [targ.substring(base.length + 1), null]
  }

  return [targ, null]
}

export function EvalSymlinks(path: string): [string, Error | null] {
  // No filesystem support, just return the cleaned path
  return [Clean(path), null]
}

export function Glob(_pattern: string): [string[], Error | null] {
  // No filesystem support, return empty array
  return [[], null]
}

// WalkFunc is the type of the function called for each file or directory
// visited by Walk. The path argument contains the argument to Walk as a
// prefix; that is, if Walk is called with "dir" and finds a file "a"
// in that directory, the walk function will be called with argument
// "dir/a". The info argument is the fs.FileInfo for the named path.
export type WalkFunc = (
  path: string,
  info: any,
  err: Error | null,
) => Error | null

export function Walk(root: string, walkFn: WalkFunc): Error | null {
  // No filesystem support, just call the function with the root
  return walkFn(root, null, new Error('filesystem not supported'))
}

export function WalkDir(_root: string, _walkFn: any): Error | null {
  // No filesystem support
  return new Error('filesystem not supported')
}

// Localize is a stub - in Go it's used for Windows path localization
export function Localize(path: string): [string, Error | null] {
  return [path, null]
}
