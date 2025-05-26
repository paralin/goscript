/**
 * VarRef represents a Go variable which can be referred to by other variables.
 *
 * For example:
 *   var myVariable int // variable referenced
 *   myOtherVar := &myVariable
 */
export type VarRef<T> = { value: T }

/** Wrap a non-null T in a variable reference. */
export function varRef<T>(v: T): VarRef<T> {
  // We create a new object wrapper for every varRef call to ensure
  // distinct pointer identity, crucial for pointer comparisons (p1 == p2).
  return { value: v }
}

/** Dereference a variable reference, throws on null → simulates Go panic. */
export function unref<T>(b: VarRef<T>): T {
  if (b === null) {
    throw new Error(
      'runtime error: invalid memory address or nil pointer dereference',
    )
  }
  return b.value
}
