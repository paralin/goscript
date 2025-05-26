import * as $ from "@goscript/builtin/builtin.js";

import * as _ from "@goscript/unsafe/index.js"

// Equal reports whether two maps contain the same key/value pairs.
// Values are compared using ==.
export function Equal<K extends $.Comparable, V extends $.Comparable>(m1: Map<K, V>, m2: Map<K, V>): boolean {
	if ($.len(m1) != $.len(m2)) {
		return false
	}
	for (const [k, v1] of m1.entries()) {
		{
			{
				let [v2, ok] = $.mapGet(m2, k, null as any)
				if (!ok || v1 != v2) {
					return false
				}
			}
		}
	}
	return true
}

// EqualFunc is like Equal, but compares values using eq.
// Keys are still compared with ==.
export function EqualFunc<K extends $.Comparable, V1, V2>(m1: Map<K, V1>, m2: Map<K, V2>, eq: ((p0: V1, p1: V2) => boolean) | null): boolean {
	if ($.len(m1) != $.len(m2)) {
		return false
	}
	for (const [k, v1] of m1.entries()) {
		{
			{
				let [v2, ok] = $.mapGet(m2, k, null as any)
				if (!ok || !eq!(v1, v2)) {
					return false
				}
			}
		}
	}
	return true
}

// clone returns a shallow copy of the map.
export function clone<K extends $.Comparable, V>(m: Map<K, V> | null): Map<K, V> | null {
	if (m == null) {
		return null
	}
	const result = $.makeMap<K, V>()
	for (const [k, v] of m.entries()) {
		$.mapSet(result, k, v)
	}
	return result
}

// Clone returns a copy of m.  This is a shallow clone:
// the new keys and values are set using ordinary assignment.
export function Clone<K extends $.Comparable, V>(m: Map<K, V>): Map<K, V> {
	// Preserve nil in case it matters.
	if (m == null) {
		return null as unknown as Map<K, V>
	}
	return clone(m)!
}

// Copy copies all key/value pairs in src adding them to dst.
// When a key in src is already present in dst,
// the value in dst will be overwritten by the value associated
// with the key in src.
export function Copy<K extends $.Comparable, V>(dst: Map<K, V>, src: Map<K, V>): void {
	for (const [k, v] of src.entries()) {
		{
			$.mapSet(dst, k, v)
		}
	}
}

// DeleteFunc deletes any key/value pairs from m for which del returns true.
export function DeleteFunc<K extends $.Comparable, V>(m: Map<K, V>, del: ((p0: K, p1: V) => boolean) | null): void {
	for (const [k, v] of m.entries()) {
		{
			if (del!(k, v)) {
				$.deleteMapEntry(m, k)
			}
		}
	}
}

