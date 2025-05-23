/**
 * Box represents a Go variable which can be referred to by other variables.
 *
 * For example:
 *   var myVariable int // boxed
 *   myOtherVar := &myVariable
 */
export type Box<T> = { value: T }

/** Wrap a non-null T in a pointer‐box. */
export function box<T>(v: T): Box<T> {
  // We create a new object wrapper for every box call to ensure
  // distinct pointer identity, crucial for pointer comparisons (p1 == p2).
  return { value: v }
}

/** Dereference a pointer‐box, throws on null → simulates Go panic. */
export function unbox<T>(b: Box<T>): T {
  if (b === null) {
    throw new Error(
      'runtime error: invalid memory address or nil pointer dereference',
    )
  }
  return b.value
}
