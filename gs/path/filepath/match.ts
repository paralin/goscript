// Pattern matching functions for filepath

export const ErrBadPattern = new Error('syntax error in pattern')

// Match reports whether name matches the shell file name pattern.
// The pattern syntax is:
//
//	pattern:
//		{ term }
//	term:
//		'*'         matches any sequence of non-Separator characters
//		'?'         matches any single non-Separator character
//		'[' [ '^' ] { character-range } ']'
//		            character class (must be non-empty)
//		c           matches character c (c != '*', '?', '\\', '[')
//		'\\' c      matches character c
//
//	character-range:
//		c           matches character c (c != '\\', '-', ']')
//		'\\' c      matches character c
//		lo '-' hi   matches character c for lo <= c <= hi
//
// Match requires pattern to match all of name, not just a substring.
// The only possible returned error is ErrBadPattern, when pattern
// is malformed.
export function Match(pattern: string, name: string): [boolean, Error | null] {
  try {
    // Validate pattern first
    validatePattern(pattern)
    return [matchPattern(pattern, name), null]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return [false, ErrBadPattern]
  }
}

function validatePattern(pattern: string): void {
  let i = 0

  while (i < pattern.length) {
    const char = pattern[i]

    switch (char) {
      case '\\':
        // Must be followed by another character
        i++
        if (i >= pattern.length) {
          throw new Error('bad pattern')
        }
        i++
        break

      case '[': {
        // Must have a properly closed character class
        i++
        let foundContent = false
        let foundClose = false

        // Skip negation
        if (i < pattern.length && pattern[i] === '^') {
          i++
        }

        while (i < pattern.length) {
          if (pattern[i] === ']') {
            foundClose = true
            i++
            break
          }

          foundContent = true

          if (pattern[i] === '\\') {
            i++ // Skip escape character
            if (i >= pattern.length) {
              throw new Error('bad pattern')
            }
          }
          i++
        }

        if (!foundClose || !foundContent) {
          throw new Error('bad pattern')
        }
        break
      }

      default:
        i++
        break
    }
  }
}

function matchPattern(pattern: string, name: string): boolean {
  let patternIndex = 0
  let nameIndex = 0

  while (patternIndex < pattern.length && nameIndex < name.length) {
    const p = pattern[patternIndex]

    switch (p) {
      case '*':
        // Handle star - match any sequence of characters
        patternIndex++
        if (patternIndex >= pattern.length) {
          // Pattern ends with *, matches rest of name
          return true
        }

        // Try to match the rest of the pattern with remaining name
        for (let i = nameIndex; i <= name.length; i++) {
          if (
            matchPattern(pattern.substring(patternIndex), name.substring(i))
          ) {
            return true
          }
        }
        return false

      case '?':
        // Match any single character except separator
        if (name[nameIndex] === '/') {
          return false
        }
        patternIndex++
        nameIndex++
        break

      case '[': {
        // Character class
        const [matched, newPatternIndex] = matchCharClass(
          pattern,
          patternIndex,
          name[nameIndex],
        )
        if (!matched) {
          return false
        }
        patternIndex = newPatternIndex
        nameIndex++
        break
      }

      case '\\':
        // Escaped character (pattern already validated)
        patternIndex++
        if (pattern[patternIndex] !== name[nameIndex]) {
          return false
        }
        patternIndex++
        nameIndex++
        break

      default:
        // Literal character
        if (p !== name[nameIndex]) {
          return false
        }
        patternIndex++
        nameIndex++
        break
    }
  }

  // Handle any remaining stars in pattern
  while (patternIndex < pattern.length && pattern[patternIndex] === '*') {
    patternIndex++
  }

  // Both pattern and name should be fully consumed
  return patternIndex >= pattern.length && nameIndex >= name.length
}

function matchCharClass(
  pattern: string,
  start: number,
  char: string,
): [boolean, number] {
  let index = start + 1
  let negated = false

  // Check for negation
  if (index < pattern.length && pattern[index] === '^') {
    negated = true
    index++
  }

  let matched = false

  while (index < pattern.length) {
    if (pattern[index] === ']') {
      index++
      break
    }

    if (pattern[index] === '\\') {
      // Escaped character
      index++
      if (pattern[index] === char) {
        matched = true
      }
      index++
    } else if (
      index + 2 < pattern.length &&
      pattern[index + 1] === '-' &&
      pattern[index + 2] !== ']'
    ) {
      // Character range
      const lo = pattern[index]
      const hi = pattern[index + 2]
      if (char >= lo && char <= hi) {
        matched = true
      }
      index += 3
    } else {
      // Single character
      if (pattern[index] === char) {
        matched = true
      }
      index++
    }
  }

  if (negated) {
    matched = !matched
  }

  return [matched, index]
}

// Glob returns the names of all files matching pattern or null
// if there is no matching file. The syntax of patterns is the same
// as in Match. The pattern may describe hierarchical names such as
// /usr/*/bin/ed (assuming the Separator is '/').
//
// Glob ignores file system errors such as I/O errors reading directories.
// The only possible returned error is ErrBadPattern, when pattern is malformed.
export function Glob(pattern: string): [string[], Error | null] {
  try {
    // Validate the pattern using the same logic as Match
    validatePattern(pattern)
    // We don't have filesystem access, so return empty array
    return [[], null]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return [[], ErrBadPattern]
  }
}
