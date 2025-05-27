import * as $ from '@goscript/builtin/builtin.js'

import * as iter from '@goscript/iter/index.js'

// All returns an iterator over key-value pairs from m.
// The iteration order is not specified and is not guaranteed
// to be the same from one call to the next.
export function All<K extends $.Comparable, V>(m: Map<K, V>): iter.Seq2<K, V> {
  return (_yield: ((p0: K, p1: V) => boolean) | null): void => {
    for (const [k, v] of m.entries()) {
      if (!_yield!(k, v)) {
        return
      }
    }
  }
}

// Keys returns an iterator over keys in m.
// The iteration order is not specified and is not guaranteed
// to be the same from one call to the next.
export function Keys<K extends $.Comparable, V>(m: Map<K, V>): iter.Seq<K> {
  return (_yield: ((p0: K) => boolean) | null): void => {
    for (const [k, _v] of m.entries()) {
      if (!_yield!(k)) {
        return
      }
    }
  }
}

// Values returns an iterator over values in m.
// The iteration order is not specified and is not guaranteed
// to be the same from one call to the next.
export function Values<K extends $.Comparable, V>(m: Map<K, V>): iter.Seq<V> {
  return (_yield: ((p0: V) => boolean) | null): void => {
    for (const [_k, v] of m.entries()) {
      if (!_yield!(v)) {
        return
      }
    }
  }
}

// Insert adds the key-value pairs from seq to m.
// If a key in seq already exists in m, its value will be overwritten.
export function Insert<K extends $.Comparable, V>(
  m: Map<K, V>,
  seq: iter.Seq2<K, V>,
): void {
  ;(() => {
    let shouldContinue = true
    seq!((k, v) => {
      $.mapSet(m, k, v)
      return shouldContinue
    })
  })()
}

// Collect collects key-value pairs from seq into a new map
// and returns it.
export function Collect<K extends $.Comparable, V>(
  seq: iter.Seq2<K, V>,
): Map<K, V> {
  let m = $.makeMap<K, V>()
  Insert(m, seq)
  return m
}
