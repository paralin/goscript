import * as $ from '@goscript/builtin/builtin.js'

// DeepEqual reports whether x and y are "deeply equal," defined as follows.
// Two values of identical type are deeply equal if one of the following cases applies.
// Values of distinct types are never deeply equal.
//
// Array values are deeply equal when their corresponding elements are deeply equal.
//
// Struct values are deeply equal if their corresponding fields,
// both exported and unexported, are deeply equal.
//
// Func values are deeply equal if both are nil; otherwise they are not deeply equal.
//
// Interface values are deeply equal if they hold deeply equal concrete values.
//
// Map values are deeply equal when all of the following are true:
// they are both nil or both non-nil, they have the same length,
// and either they are the same map object or their corresponding keys
// (matched using Go equality) map to deeply equal values.
//
// Pointer values are deeply equal if they are equal using Go's == operator
// or if they point to deeply equal values.
//
// Slice values are deeply equal when all of the following are true:
// they are both nil or both non-nil, they have the same length,
// and either they point to the same initial entry of the same underlying array
// (that is, &x[0] == &y[0]) or their corresponding elements (up to length) are deeply equal.
// Note that a non-nil empty slice and a nil slice (for example, []byte{} and []byte(nil))
// are not deeply equal.
//
// Other values - numbers, bools, strings, and channels - are deeply equal
// if they are equal using Go's == operator.
//
// In general DeepEqual is a recursive relaxation of Go's == operator.
// However, this idea is impossible to implement without some inconsistency.
// Specifically, it is possible for a value to be unequal to itself,
// either because it is of func type (uncomparable in general)
// or because it is a floating-point NaN value (not equal to itself in floating-point comparison),
// or because it is an array, struct, or interface containing
// such a value.
// On the other hand, pointer values are always equal to themselves,
// even if they point at or contain such problematic values,
// because they compare equal using Go's == operator, and that
// is a sufficient condition to be deeply equal, regardless of content.
// DeepEqual has been defined so that the same short-cut applies
// to slices and maps: if x and y are the same slice or the same map,
// they are deeply equal regardless of content.
//
// As DeepEqual traverses the data values it may find a cycle. The
// second and subsequent times that DeepEqual compares two pointer
// values that have been compared before, it treats the values as
// equal rather than examining the values to which they point.
// This ensures that DeepEqual terminates.
export function DeepEqual(x: null | any, y: null | any): boolean {
  // Handle null/undefined cases
  if (x === y) {
    return true
  }

  if (x === null || y === null || x === undefined || y === undefined) {
    return x === y
  }

  // Check for identical references first
  if (x === y) {
    return true
  }

  // Different types are never equal
  if (typeof x !== typeof y) {
    return false
  }

  // Handle arrays (including GoScript slices)
  if (globalThis.Array.isArray(x) && globalThis.Array.isArray(y)) {
    if (x.length !== y.length) {
      return false
    }
    for (let i = 0; i < x.length; i++) {
      if (!DeepEqual(x[i], y[i])) {
        return false
      }
    }
    return true
  }

  // Handle GoScript slice objects with __meta__ structure
  if (x && y && typeof x === 'object' && typeof y === 'object') {
    // Check if both are GoScript slices
    if ('__meta__' in x && '__meta__' in y) {
      const xMeta = (
        x as { __meta__?: { backing?: unknown[]; length?: number } }
      ).__meta__
      const yMeta = (
        y as { __meta__?: { backing?: unknown[]; length?: number } }
      ).__meta__

      if (
        xMeta &&
        yMeta &&
        'backing' in xMeta &&
        'backing' in yMeta &&
        'length' in xMeta &&
        'length' in yMeta &&
        globalThis.Array.isArray(xMeta.backing) &&
        globalThis.Array.isArray(yMeta.backing) &&
        typeof xMeta.length === 'number' &&
        typeof yMeta.length === 'number'
      ) {
        // Compare lengths
        if (xMeta.length !== yMeta.length) {
          return false
        }

        // Compare elements
        for (let i = 0; i < xMeta.length; i++) {
          if (!DeepEqual(xMeta.backing[i], yMeta.backing[i])) {
            return false
          }
        }
        return true
      }
    }
  }

  // Handle Maps
  if (x instanceof globalThis.Map && y instanceof globalThis.Map) {
    if (x.size !== y.size) {
      return false
    }
    for (const [key, value] of x) {
      if (!y.has(key) || !DeepEqual(value, y.get(key))) {
        return false
      }
    }
    return true
  }

  // Handle objects (structs)
  if (typeof x === 'object' && typeof y === 'object') {
    const keysX = Object.keys(x)
    const keysY = Object.keys(y)
    if (keysX.length !== keysY.length) {
      return false
    }
    for (const key of keysX) {
      if (!keysY.includes(key) || !DeepEqual(x[key], y[key])) {
        return false
      }
    }
    return true
  }

  // For primitive values, use direct comparison
  return x === y
}
