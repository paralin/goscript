import * as $ from '@goscript/builtin/builtin.js'

// Compare returns an integer comparing two strings lexicographically.
// The result will be 0 if a == b, -1 if a < b, and +1 if a > b.
//
// Compare is included only for symmetry with package bytes.
// It is usually clearer and always faster to use the built-in
// string comparison operators ==, <, >, and so on.
export function Compare(a: string, b: string): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}
