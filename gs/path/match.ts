import * as $ from '@goscript/builtin/index.js'

import * as errors from '@goscript/errors/index.js'

import * as utf8 from '@goscript/unicode/utf8/index.js'

export let ErrBadPattern: $.GoError = errors.New('syntax error in pattern')

// Match reports whether name matches the shell pattern.
// The pattern syntax is:
//
//	pattern:
//		{ term }
//	term:
//		'*'         matches any sequence of non-/ characters
//		'?'         matches any single non-/ character
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
// The only possible returned error is [ErrBadPattern], when pattern
// is malformed.
export function Match(pattern: string, name: string): [boolean, $.GoError] {
  {
    // Trailing * matches rest of string unless it has a /.

    // Look for match at current position.

    // if we're the last chunk, make sure we've exhausted the name
    // otherwise we'll give a false result even if we could still match
    // using the star

    // Look for match skipping i+1 bytes.
    // Cannot skip /.

    // if we're the last chunk, make sure we exhausted the name

    // Before returning false with no error,
    // check that the remainder of the pattern is syntactically valid.
    Pattern: for (; $.len(pattern) > 0; ) {
      let star: boolean = false
      let chunk: string = ''
      let rest: string = ''
      let scanResult = scanChunk(pattern)
      star = scanResult[0]
      chunk = scanResult[1]
      rest = scanResult[2]
      pattern = rest

      // Trailing * matches rest of string unless it has a /.
      if (star && chunk == '') {
        // Trailing * matches rest of string unless it has a /.
        return [name.indexOf('/') < 0, null]
      }
      // Look for match at current position.
      let [t, ok, err] = matchChunk(chunk, name)
      // if we're the last chunk, make sure we've exhausted the name
      // otherwise we'll give a false result even if we could still match
      // using the star
      if (ok && ($.len(t) == 0 || $.len(pattern) > 0)) {
        name = t
        continue
      }
      if (err != null) {
        return [false, err]
      }

      // Look for match skipping i+1 bytes.
      // Cannot skip /.

      // if we're the last chunk, make sure we exhausted the name
      if (star) {
        // Look for match skipping i+1 bytes.
        // Cannot skip /.

        // if we're the last chunk, make sure we exhausted the name
        for (let i = 0; i < $.len(name) && $.indexString(name, i) != 47; i++) {
          let [t, ok, err] = matchChunk(
            chunk,
            $.sliceString(name, i, undefined),
          )

          // if we're the last chunk, make sure we exhausted the name
          if (ok) {
            // if we're the last chunk, make sure we exhausted the name
            if ($.len(pattern) == 0 && $.len(t) > 0) {
              continue
            }
            name = t
            continue Pattern
          }
          if (err != null) {
            return [false, err]
          }
        }
      }
      // Before returning false with no error,
      // check that the remainder of the pattern is syntactically valid.
      for (; $.len(pattern) > 0; ) {
        // let star2: boolean = false
        let chunk2: string = ''
        let rest2: string = ''
        let scanResult2 = scanChunk(pattern)
        // star2 = scanResult2[0]
        chunk2 = scanResult2[1]
        rest2 = scanResult2[2]
        pattern = rest2
        {
          let [, , err] = matchChunk(chunk2, '')
          if (err != null) {
            return [false, err]
          }
        }
      }
      return [false, null]
    }
    return [$.len(name) == 0, null]
  }
}

// scanChunk gets the next segment of pattern, which is a non-star string
// possibly preceded by a star.
export function scanChunk(pattern: string): [boolean, string, string] {
  let star: boolean = false
  {
    for (; $.len(pattern) > 0 && $.indexString(pattern, 0) == 42; ) {
      pattern = $.sliceString(pattern, 1, undefined)
      star = true
    }
    let inrange = false
    let i: number = 0

    // error check handled in matchChunk: bad pattern.
    Scan: for (i = 0; i < $.len(pattern); i++) {
      // error check handled in matchChunk: bad pattern.
      switch ($.indexString(pattern, i)) {
        case 92:
          if (i + 1 < $.len(pattern)) {
            i++
          }
          break
        case 91:
          inrange = true
          break
        case 93:
          inrange = false
          break
        case 42:
          if (!inrange) {
            break Scan
          }
          break
      }
    }
    return [
      star,
      $.sliceString(pattern, 0, i),
      $.sliceString(pattern, i, undefined),
    ]
  }
}

// matchChunk checks whether chunk matches the beginning of s.
// If so, it returns the remainder of s (after the match).
// Chunk is all single-character operators: literals, char classes, and ?.
export function matchChunk(
  chunk: string,
  s: string,
): [string, boolean, $.GoError] {
  let err: $.GoError = null
  {
    // failed records whether the match has failed.
    // After the match fails, the loop continues on processing chunk,
    // checking that the pattern is well-formed but no longer reading s.
    let failed = false

    // character class

    // possibly negated

    // parse all ranges
    for (; $.len(chunk) > 0; ) {
      if (!failed && $.len(s) == 0) {
        failed = true
      }

      // character class

      // possibly negated

      // parse all ranges
      switch ($.indexString(chunk, 0)) {
        case 91: {
          let r: number = 0
          if (!failed) {
            let n: number = 0
            let decoded = utf8.DecodeRuneInString(s)
            r = decoded[0]
            n = decoded[1]
            s = $.sliceString(s, n, undefined)
          }
          chunk = $.sliceString(chunk, 1, undefined)
          let negated = false
          if ($.len(chunk) > 0 && $.indexString(chunk, 0) == 94) {
            negated = true
            chunk = $.sliceString(chunk, 1, undefined)
          }
          let match = false
          let nrange = 0
          for (;;) {
            if (
              $.len(chunk) > 0 &&
              $.indexString(chunk, 0) == 93 &&
              nrange > 0
            ) {
              chunk = $.sliceString(chunk, 1, undefined)
              break
            }
            let lo: number = 0
            let hi: number = 0
            {
              let escResult = getEsc(chunk)
              lo = escResult[0]
              chunk = escResult[1]
              err = escResult[2]
              if (err != null) {
                return ['', false, err]
              }
            }
            hi = lo
            if ($.indexString(chunk, 0) == 45) {
              {
                let escResult2 = getEsc($.sliceString(chunk, 1, undefined))
                hi = escResult2[0]
                chunk = escResult2[1]
                err = escResult2[2]
                if (err != null) {
                  return ['', false, err]
                }
              }
            }
            if (lo <= r && r <= hi) {
              match = true
            }
            nrange++
          }
          if (match == negated) {
            failed = true
          }
          break
        }
        case 63: {
          if (!failed) {
            if ($.indexString(s, 0) == 47) {
              failed = true
            }
            let [, n] = utf8.DecodeRuneInString(s)
            s = $.sliceString(s, n, undefined)
          }
          chunk = $.sliceString(chunk, 1, undefined)
          break
        }
        case 92: {
          chunk = $.sliceString(chunk, 1, undefined)
          if ($.len(chunk) == 0) {
            return ['', false, ErrBadPattern]
          }
          // unhandled branch statement token: fallthrough
          break
        }
        default: {
          if (!failed) {
            if ($.indexString(chunk, 0) != $.indexString(s, 0)) {
              failed = true
            }
            s = $.sliceString(s, 1, undefined)
          }
          chunk = $.sliceString(chunk, 1, undefined)
          break
        }
      }
    }
    if (failed) {
      return ['', false, null]
    }
    return [s, true, null]
  }
}

export function getEsc(chunk: string): [number, string, $.GoError] {
  if (
    $.len(chunk) == 0 ||
    $.indexString(chunk, 0) == 45 ||
    $.indexString(chunk, 0) == 93
  ) {
    return [0, '', ErrBadPattern]
  }
  if ($.indexString(chunk, 0) == 92) {
    chunk = $.sliceString(chunk, 1, undefined)
    if ($.len(chunk) == 0) {
      return [0, '', ErrBadPattern]
    }
  }
  let [r, n] = utf8.DecodeRuneInString(chunk)
  if (r == utf8.RuneError && n == 1) {
    return [0, '', ErrBadPattern]
  }
  chunk = $.sliceString(chunk, n, undefined)
  if ($.len(chunk) == 0 || $.indexString(chunk, 0) != 45 || $.len(chunk) == 1) {
    return [r, chunk, null]
  }
  return [r, chunk, null]
}
