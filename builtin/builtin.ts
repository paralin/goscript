/**
 * GoSliceObject contains metadata for complex slice views
 */
interface GoSliceObject<T> {
  backing: T[] // The backing array
  offset: number // Offset into the backing array
  length: number // Length of the slice
  capacity: number // Capacity of the slice
}

/**
 * SliceProxy is a proxy object for complex slices
 */
export type SliceProxy<T> = T[] & {
  __meta__: GoSliceObject<T>
}

/**
 * Slice<T> is a union type that is either a plain array or a proxy
 * null represents the nil state.
 */
export type Slice<T> = T[] | SliceProxy<T> | null

export function asArray<T>(slice: Slice<T>): T[] {
  return slice as T[]
}

/**
 * isComplexSlice checks if a slice is a complex slice (has __meta__ property)
 */
function isComplexSlice<T>(slice: Slice<T>): slice is SliceProxy<T> {
  return (
    slice !== null &&
    slice !== undefined &&
    '__meta__' in slice &&
    slice.__meta__ !== undefined
  )
}

/**
 * Creates a new slice with the specified length and capacity.
 * @param length The length of the slice.
 * @param capacity The capacity of the slice (optional).
 * @returns A new slice.
 */
export const makeSlice = <T>(length: number, capacity?: number): Slice<T> => {
  if (capacity === undefined) {
    capacity = length
  }

  if (length < 0 || capacity < 0 || length > capacity) {
    throw new Error(
      `Invalid slice length (${length}) or capacity (${capacity})`,
    )
  }

  const arr = new Array<T>(length)

  // Always create a complex slice with metadata to preserve capacity information
  const proxy = arr as SliceProxy<T>
  proxy.__meta__ = {
    backing: new Array<T>(capacity),
    offset: 0,
    length: length,
    capacity: capacity,
  }

  for (let i = 0; i < length; i++) {
    proxy.__meta__.backing[i] = arr[i]
  }

  return proxy
}

/**
 * goSlice creates a slice from s[low:high:max]
 * Arguments mirror Go semantics; omitted indices are undefined.
 *
 * @param s The original slice
 * @param low Starting index (defaults to 0)
 * @param high Ending index (defaults to s.length)
 * @param max Capacity limit (defaults to original capacity)
 */
export const goSlice = <T>(
  s: Slice<T>,
  low?: number,
  high?: number,
  max?: number,
): Slice<T> => {
  if (s === null || s === undefined) {
    throw new Error('Cannot slice nil')
  }

  const slen = len(s)
  low = low ?? 0
  high = high ?? slen

  if (low < 0 || high < low) {
    throw new Error(`Invalid slice indices: ${low}:${high}`)
  }

  // In Go, high can be up to capacity, not just length
  const scap = cap(s)
  if (high > scap) {
    throw new Error(`Slice index out of range: ${high} > ${scap}`)
  }

  if (
    Array.isArray(s) &&
    !isComplexSlice(s) &&
    low === 0 &&
    high === s.length &&
    max === undefined
  ) {
    return s
  }

  let backing: T[]
  let oldOffset = 0
  let oldCap = scap

  // Get the backing array and offset
  if (isComplexSlice(s)) {
    backing = s.__meta__.backing
    oldOffset = s.__meta__.offset
    oldCap = s.__meta__.capacity
  } else {
    backing = s as T[]
  }

  let newCap
  if (max !== undefined) {
    if (max < high) {
      throw new Error(`Invalid slice indices: ${low}:${high}:${max}`)
    }
    if (isComplexSlice(s) && max > oldOffset + oldCap) {
      throw new Error(
        `Slice index out of range: ${max} > ${oldOffset + oldCap}`,
      )
    }
    if (!isComplexSlice(s) && max > s.length) {
      throw new Error(`Slice index out of range: ${max} > ${s.length}`)
    }
    newCap = max - low
  } else {
    // For slices of slices, capacity should be the capacity of the original slice minus the low index
    if (isComplexSlice(s)) {
      newCap = oldCap - low
    } else {
      newCap = s.length - low
    }
  }

  const newLength = high - low
  const newOffset = oldOffset + low

  const target = {
    __meta__: {
      backing: backing,
      offset: newOffset,
      length: newLength,
      capacity: newCap,
    },
  }

  const handler = {
    get(target: any, prop: string | symbol): any {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = Number(prop)
        if (index >= 0 && index < target.__meta__.length) {
          return target.__meta__.backing[target.__meta__.offset + index]
        }
        throw new Error(
          `Slice index out of range: ${index} >= ${target.__meta__.length}`,
        )
      }

      if (prop === 'length') {
        return target.__meta__.length
      }

      if (prop === '__meta__') {
        return target.__meta__
      }

      if (
        prop === 'slice' ||
        prop === 'map' ||
        prop === 'filter' ||
        prop === 'reduce' ||
        prop === 'forEach' ||
        prop === Symbol.iterator
      ) {
        const backingSlice = target.__meta__.backing.slice(
          target.__meta__.offset,
          target.__meta__.offset + target.__meta__.length,
        )
        return backingSlice[prop].bind(backingSlice)
      }

      return Reflect.get(target, prop)
    },

    set(target: any, prop: string | symbol, value: any): boolean {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = Number(prop)
        if (index >= 0 && index < target.__meta__.length) {
          target.__meta__.backing[target.__meta__.offset + index] = value
          return true
        }
        if (
          index === target.__meta__.length &&
          target.__meta__.length < target.__meta__.capacity
        ) {
          target.__meta__.backing[target.__meta__.offset + index] = value
          target.__meta__.length++
          return true
        }
        throw new Error(
          `Slice index out of range: ${index} >= ${target.__meta__.length}`,
        )
      }

      if (prop === 'length' || prop === '__meta__') {
        return false
      }

      return Reflect.set(target, prop, value)
    },
  }

  return new Proxy(target, handler) as unknown as SliceProxy<T>
}

/**
 * Creates a new map (TypeScript Map).
 * @returns A new TypeScript Map.
 */
export const makeMap = <K, V>(): Map<K, V> => {
  return new Map<K, V>()
}

/**
 * Converts a JavaScript array to a Go slice.
 * For multi-dimensional arrays, recursively converts nested arrays to slices.
 * @param arr The JavaScript array to convert
 * @param depth How many levels of nesting to convert (default: 1, use Infinity for all levels)
 * @returns A Go slice containing the same elements
 */
export const arrayToSlice = <T>(
  arr: T[] | null | undefined,
  depth: number = 1,
): T[] => {
  if (arr == null) return [] as T[]

  if (arr.length === 0) return arr

  const target = {
    __meta__: {
      backing: arr,
      offset: 0,
      length: arr.length,
      capacity: arr.length,
    },
  }

  const handler = {
    get(target: any, prop: string | symbol): any {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = Number(prop)
        if (index >= 0 && index < target.__meta__.length) {
          return target.__meta__.backing[target.__meta__.offset + index]
        }
        throw new Error(
          `Slice index out of range: ${index} >= ${target.__meta__.length}`,
        )
      }

      if (prop === 'length') {
        return target.__meta__.length
      }

      if (prop === '__meta__') {
        return target.__meta__
      }

      if (
        prop === 'slice' ||
        prop === 'map' ||
        prop === 'filter' ||
        prop === 'reduce' ||
        prop === 'forEach' ||
        prop === Symbol.iterator
      ) {
        const backingSlice = target.__meta__.backing.slice(
          target.__meta__.offset,
          target.__meta__.offset + target.__meta__.length,
        )
        return backingSlice[prop].bind(backingSlice)
      }

      return Reflect.get(target, prop)
    },

    set(target: any, prop: string | symbol, value: any): boolean {
      if (typeof prop === 'string' && /^\d+$/.test(prop)) {
        const index = Number(prop)
        if (index >= 0 && index < target.__meta__.length) {
          target.__meta__.backing[target.__meta__.offset + index] = value
          return true
        }
        if (
          index === target.__meta__.length &&
          target.__meta__.length < target.__meta__.capacity
        ) {
          target.__meta__.backing[target.__meta__.offset + index] = value
          target.__meta__.length++
          return true
        }
        throw new Error(
          `Slice index out of range: ${index} >= ${target.__meta__.length}`,
        )
      }

      if (prop === 'length' || prop === '__meta__') {
        return false
      }

      return Reflect.set(target, prop, value)
    },
  }

  // Recursively convert nested arrays if depth > 1
  if (depth > 1 && arr.length > 0) {
    for (let i = 0; i < arr.length; i++) {
      const item = arr[i]
      if (isComplexSlice(item as any)) {
      } else if (Array.isArray(item)) {
        arr[i] = arrayToSlice(item as any[], depth - 1) as any
      } else if (
        item &&
        typeof item === 'object' &&
        isComplexSlice(item as any)
      ) {
        // Preserve capacity information for complex slices
      }
    }
  }

  return new Proxy(target, handler) as unknown as SliceProxy<T>
}

/**
 * Returns the length of a collection (string, array, slice, map, or set).
 * @param obj The collection to get the length of.
 * @returns The length of the collection.
 */
export const len = <T = unknown, V = unknown>(
  obj: string | Array<T> | Slice<T> | Map<T, V> | Set<T> | null | undefined,
): number => {
  if (obj === null || obj === undefined) {
    return 0
  }

  if (typeof obj === 'string') {
    return obj.length
  }

  if (obj instanceof Map || obj instanceof Set) {
    return obj.size
  }

  if (isComplexSlice(obj)) {
    return obj.__meta__.length
  }

  if (Array.isArray(obj)) {
    return obj.length
  }

  return 0 // Default fallback
}

/**
 * Returns the capacity of a slice.
 * @param obj The slice.
 * @returns The capacity of the slice.
 */
export const cap = <T>(obj: Slice<T>): number => {
  if (obj === null || obj === undefined) {
    return 0
  }

  if (isComplexSlice(obj)) {
    return obj.__meta__.capacity
  }

  if (Array.isArray(obj)) {
    return obj.length
  }

  return 0
}

/**
 * Appends elements to a slice.
 * Note: In Go, append can return a new slice if the underlying array is reallocated.
 * This helper emulates that by returning the modified or new slice.
 * @param slice The slice to append to.
 * @param elements The elements to append.
 * @returns The modified or new slice.
 */
export const append = <T>(slice: Slice<T>, ...elements: T[]): T[] => {
  if (slice === null || slice === undefined) {
    if (elements.length === 0) {
      return [] as T[]
    } else {
      return elements.slice(0) as T[]
    }
  }

  if (elements.length === 0) {
    return slice
  }

  const oldLen = len(slice)
  const oldCap = cap(slice)
  const newLen = oldLen + elements.length

  if (newLen <= oldCap) {
    if (isComplexSlice(slice)) {
      const offset = slice.__meta__.offset
      const backing = slice.__meta__.backing

      for (let i = 0; i < elements.length; i++) {
        backing[offset + oldLen + i] = elements[i]
      }

      const result = new Array(newLen) as SliceProxy<T>

      for (let i = 0; i < oldLen; i++) {
        result[i] = backing[offset + i]
      }
      for (let i = 0; i < elements.length; i++) {
        result[oldLen + i] = elements[i]
      }

      result.__meta__ = {
        backing: backing,
        offset: offset,
        length: newLen,
        capacity: oldCap,
      }

      return result
    } else {
      const result = new Array(newLen) as SliceProxy<T>

      for (let i = 0; i < oldLen; i++) {
        result[i] = slice[i]
      }

      for (let i = 0; i < elements.length; i++) {
        result[i + oldLen] = elements[i]

        if (i + oldLen < oldCap && Array.isArray(slice)) {
          slice[i + oldLen] = elements[i]
        }
      }

      result.__meta__ = {
        backing: slice as any,
        offset: 0,
        length: newLen,
        capacity: oldCap,
      }

      return result
    }
  } else {
    let newCap = oldCap
    if (newCap == 0) {
      newCap = elements.length
    } else {
      if (newCap < 1024) {
        newCap *= 2
      } else {
        newCap += newCap / 4
      }

      // Ensure the new capacity fits all the elements
      if (newCap < newLen) {
        newCap = newLen
      }
    }

    const newBacking = new Array<T>(newCap)

    if (isComplexSlice(slice)) {
      const offset = slice.__meta__.offset
      const backing = slice.__meta__.backing

      for (let i = 0; i < oldLen; i++) {
        newBacking[i] = backing[offset + i]
      }
    } else {
      for (let i = 0; i < oldLen; i++) {
        newBacking[i] = slice[i]
      }
    }

    for (let i = 0; i < elements.length; i++) {
      newBacking[oldLen + i] = elements[i]
    }

    if (newLen === newCap) {
      return newBacking.slice(0, newLen) as T[]
    }

    const result = new Array(newLen) as SliceProxy<T>

    for (let i = 0; i < newLen; i++) {
      result[i] = newBacking[i]
    }

    result.__meta__ = {
      backing: newBacking,
      offset: 0,
      length: newLen,
      capacity: newCap,
    }

    return result
  }
}

/**
 * Copies elements from src to dst.
 * @param dst The destination slice.
 * @param src The source slice.
 * @returns The number of elements copied.
 */
export const copy = <T>(dst: Slice<T>, src: Slice<T>): number => {
  if (dst === null || src === null) {
    return 0
  }

  const dstLen = len(dst)
  const srcLen = len(src)

  const count = Math.min(dstLen, srcLen)

  if (count === 0) {
    return 0
  }

  if (isComplexSlice(dst)) {
    const dstOffset = dst.__meta__.offset
    const dstBacking = dst.__meta__.backing

    if (isComplexSlice(src)) {
      const srcOffset = src.__meta__.offset
      const srcBacking = src.__meta__.backing

      for (let i = 0; i < count; i++) {
        dstBacking[dstOffset + i] = srcBacking[srcOffset + i]
        dst[i] = srcBacking[srcOffset + i] // Update the proxy array
      }
    } else {
      for (let i = 0; i < count; i++) {
        dstBacking[dstOffset + i] = src[i]
        dst[i] = src[i] // Update the proxy array
      }
    }
  } else {
    if (isComplexSlice(src)) {
      const srcOffset = src.__meta__.offset
      const srcBacking = src.__meta__.backing

      for (let i = 0; i < count; i++) {
        dst[i] = srcBacking[srcOffset + i]
      }
    } else {
      for (let i = 0; i < count; i++) {
        dst[i] = src[i]
      }
    }
  }

  return count
}

/**
 * Represents the Go error type (interface).
 */
export type Error = {
  Error(): string
} | null

/**
 * Converts a string to an array of Unicode code points (runes).
 * @param str The input string.
 * @returns An array of numbers representing the Unicode code points.
 */
export const stringToRunes = (str: string): number[] => {
  return Array.from(str).map((c) => c.codePointAt(0) || 0)
}

/**
 * Converts an array of Unicode code points (runes) to a string.
 * @param runes The input array of numbers representing Unicode code points.
 * @returns The resulting string.
 */
export const runesToString = (runes: Slice<number>): string => {
  return runes?.length ? String.fromCharCode(...runes) : ''
}

/**
 * Converts a number to a byte (uint8) by truncating to the range 0-255.
 * Equivalent to Go's byte() conversion.
 * @param n The number to convert to a byte.
 * @returns The byte value (0-255).
 */
export const byte = (n: number): number => {
  return n & 0xff // Bitwise AND with 255 ensures we get a value in the range 0-255
}

/** Box represents a Go variable which can be referred to by other variables.
 *
 * For example:
 *   var myVariable int
 *
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

/**
 * Gets a value from a map, with a default value if the key doesn't exist.
 * @param map The map to get from.
 * @param key The key to get.
 * @param defaultValue The default value to return if the key doesn't exist (defaults to 0).
 * @returns The value for the key, or the default value if the key doesn't exist.
 */
export const mapGet = <K, V>(
  map: Map<K, V>,
  key: K,
  defaultValue: V | null = null,
): V | null => {
  return map.has(key) ? map.get(key)! : defaultValue
}

/**
 * Sets a value in a map.
 * @param map The map to set in.
 * @param key The key to set.
 * @param value The value to set.
 */
export const mapSet = <K, V>(map: Map<K, V>, key: K, value: V): void => {
  map.set(key, value)
}

/**
 * Deletes a key from a map.
 * @param map The map to delete from.
 * @param key The key to delete.
 */
export const deleteMapEntry = <K, V>(map: Map<K, V>, key: K): void => {
  map.delete(key)
}

/**
 * Checks if a key exists in a map.
 * @param map The map to check in.
 * @param key The key to check.
 * @returns True if the key exists, false otherwise.
 */
export const mapHas = <K, V>(map: Map<K, V>, key: K): boolean => {
  return map.has(key)
}

/**
 * Represents the kinds of Go types that can be registered at runtime.
 */
export enum TypeKind {
  Struct = 'struct',
  Interface = 'interface',
  Basic = 'basic',
  Pointer = 'pointer',
  Slice = 'slice',
  Map = 'map',
  Channel = 'channel',
  Function = 'function',
}

/**
 * Type description can be either:
 * - A string (type name for registered types)
 * - A TypeInfo object (for dynamic type checking)
 * - A constructor function (for classes/structs)
 */
export type TypeDescription = string | TypeInfo | (new (...args: any[]) => any)

/**
 * Represents type information for a Go type in the runtime.
 */
export interface TypeInfo {
  name?: string
  kind: TypeKind
  zeroValue?: any
  // For interfaces, the set of methods
  methods?: Set<string>
  // For structs, the constructor
  constructor?: any
  // For map, the key and element types
  keyType?: TypeDescription
  elemType?: TypeDescription
  // For basic types, the JavaScript type
  jsType?: string
}

// Registry to store runtime type information
const typeRegistry = new Map<string, TypeInfo>()

/**
 * Registers a type with the runtime type system.
 *
 * @param name The name of the type.
 * @param kind The kind of the type.
 * @param zeroValue The zero value for the type.
 * @param methods Optional set of method names for interfaces.
 * @param constructor Optional constructor for structs.
 * @returns The type information object for chaining.
 */
export const registerType = (
  name: string,
  kind: TypeKind,
  zeroValue: any,
  methods?: Set<string>,
  constructor?: Function,
): TypeInfo => {
  const typeInfo: TypeInfo = {
    name,
    kind,
    zeroValue,
    methods,
    constructor,
  }
  typeRegistry.set(name, typeInfo)
  return typeInfo
}

/**
 * Represents the result of a type assertion.
 */
export interface TypeAssertResult<T> {
  value: T
  ok: boolean
}

/**
 * Normalizes a type description into a TypeInfo object
 */
function normalizeTypeDescription(typeDesc: TypeDescription): TypeInfo {
  // If it's already a TypeInfo object, return it
  if (typeof typeDesc === 'object' && 'kind' in typeDesc) {
    return typeDesc
  }

  // If it's a string (registered type name), look it up
  if (typeof typeDesc === 'string') {
    const registeredType = typeRegistry.get(typeDesc)
    if (registeredType) {
      return registeredType
    }

    // Handle basic type strings
    switch (typeDesc) {
      case 'string':
        return { kind: TypeKind.Basic, jsType: 'string', zeroValue: '' }
      case 'number':
        return { kind: TypeKind.Basic, jsType: 'number', zeroValue: 0 }
      case 'boolean':
        return { kind: TypeKind.Basic, jsType: 'boolean', zeroValue: false }
      case 'bigint':
        return { kind: TypeKind.Basic, jsType: 'bigint', zeroValue: BigInt(0) }
      default:
        // Check if it's a map type descriptor (e.g., "map[string]int")
        if (typeDesc.startsWith('map[')) {
          const endKeyIdx = typeDesc.indexOf(']')
          if (endKeyIdx > 4) {
            // "map[".length = 4
            const keyTypeName = typeDesc.substring(4, endKeyIdx)
            const valueTypeName = typeDesc.substring(endKeyIdx + 1)

            return {
              kind: TypeKind.Map,
              keyType: keyTypeName,
              elemType: valueTypeName,
              zeroValue: new Map(),
            }
          }
        }

        // Check if it's a slice type descriptor (e.g., "[]int")
        if (typeDesc.startsWith('[]')) {
          const elemTypeName = typeDesc.substring(2)
          return {
            kind: TypeKind.Slice,
            elemType: elemTypeName,
            zeroValue: [],
          }
        }

        // Unknown type name
        console.warn(
          `Type '${typeDesc}' not found in registry and is not a basic type.`,
        )
        return { kind: TypeKind.Basic, jsType: 'any', zeroValue: null }
    }
  }

  // If it's a constructor function, create a struct type
  if (typeof typeDesc === 'function') {
    return {
      kind: TypeKind.Struct,
      constructor: typeDesc,
      zeroValue: null,
    }
  }

  // Fallback
  return { kind: TypeKind.Basic, jsType: 'any', zeroValue: null }
}

/**
 * Checks if a value matches a specified type
 */
function matchesType(value: any, typeDesc: TypeDescription): boolean {
  if (value === null || value === undefined) {
    return false
  }

  const typeInfo = normalizeTypeDescription(typeDesc)

  switch (typeInfo.kind) {
    case TypeKind.Basic:
      return typeof value === typeInfo.jsType

    case TypeKind.Map:
      if (!(value instanceof Map)) return false

      // Empty map passes the type check
      if (value.size === 0) return true

      // For non-empty maps, check a sample of keys and values
      const sampleSize = Math.min(value.size, 10)
      let checked = 0
      for (const [key, val] of value.entries()) {
        if (
          !matchesType(key, typeInfo.keyType!) ||
          !matchesType(val, typeInfo.elemType!)
        ) {
          return false
        }
        if (++checked >= sampleSize) break
      }
      return true

    case TypeKind.Slice:
      if (!Array.isArray(value)) return false

      // Empty array passes the type check
      if (value.length === 0) return true

      // For non-empty arrays, check a sample of elements
      const elemType = typeInfo.elemType!
      const arraySampleSize = Math.min(value.length, 10)
      for (let i = 0; i < arraySampleSize; i++) {
        if (!matchesType(value[i], elemType)) {
          return false
        }
      }
      return true

    case TypeKind.Struct:
      return typeInfo.constructor ?
          value instanceof typeInfo.constructor
        : false

    case TypeKind.Interface:
      if (!typeInfo.methods || typeof value !== 'object') return false
      // Check if value has all required methods
      return Array.from(typeInfo.methods).every(
        (method) => typeof (value as any)[method] === 'function',
      )

    case TypeKind.Channel:
      return (
        typeof value === 'object' &&
        value !== null &&
        'send' in value &&
        'receive' in value &&
        'close' in value &&
        typeof value.send === 'function' &&
        typeof value.receive === 'function' &&
        typeof value.close === 'function'
      )

    case TypeKind.Function:
      return typeof value === 'function'

    case TypeKind.Pointer:
      // In TypeScript, we're checking if it's a non-null object
      return value !== null && typeof value === 'object'

    default:
      return false
  }
}

/**
 * Performs a type assertion at runtime.
 *
 * @param value The value to assert.
 * @param typeDesc The description of the target type (string name or TypeInfo object).
 * @returns An object with the asserted value and whether the assertion succeeded.
 */
export function typeAssert<T>(
  value: any,
  typeDesc: TypeDescription,
): TypeAssertResult<T> {
  // Handle null/undefined value case
  if (value === null || value === undefined) {
    const typeInfo = normalizeTypeDescription(typeDesc)
    return { value: typeInfo.zeroValue as T, ok: false }
  }

  // Normalize the type description to get TypeInfo
  const typeInfo = normalizeTypeDescription(typeDesc)

  // Get the zero value for failure case
  const zeroValue = typeInfo.zeroValue ?? null

  // Special handling for common container types
  if (typeInfo.kind === TypeKind.Map) {
    // Verify it's a Map instance
    if (!(value instanceof Map)) {
      return { value: new Map() as unknown as T, ok: false }
    }

    // Empty maps automatically pass type check
    if (value.size === 0) {
      return { value: value as T, ok: true }
    }

    // For non-empty maps, check key and value types on a sample (for performance)
    const sampleSize = Math.min(value.size, 10) // Just check up to 10 entries
    let checked = 0

    for (const [key, val] of value.entries()) {
      if (
        !matchesType(key, typeInfo.keyType!) ||
        !matchesType(val, typeInfo.elemType!)
      ) {
        return { value: new Map() as unknown as T, ok: false }
      }

      if (++checked >= sampleSize) break
    }

    // All checks passed
    return { value: value as T, ok: true }
  } else if (typeInfo.kind === TypeKind.Slice) {
    // Verify it's an array
    if (!Array.isArray(value)) {
      return { value: [] as unknown as T, ok: false }
    }

    // Empty arrays automatically pass
    if (value.length === 0) {
      return { value: value as T, ok: true }
    }

    // Check element type on a sample (for performance)
    const elemType = typeInfo.elemType!
    const sampleSize = Math.min(value.length, 10) // Just check up to 10 elements

    for (let i = 0; i < sampleSize; i++) {
      if (!matchesType(value[i], elemType)) {
        return { value: [] as unknown as T, ok: false }
      }
    }

    // All checks passed
    return { value: value as T, ok: true }
  } else if (typeInfo.kind === TypeKind.Struct && typeInfo.constructor) {
    // Check if value is an instance of the constructor
    if (value instanceof typeInfo.constructor) {
      return { value: value as T, ok: true }
    }
    return { value: zeroValue as T, ok: false }
  } else if (typeInfo.kind === TypeKind.Interface && typeInfo.methods) {
    // Check if value implements all methods in the interface
    if (typeof value === 'object' && value !== null) {
      const allMethodsPresent = Array.from(typeInfo.methods).every(
        (method) => typeof (value as any)[method] === 'function',
      )
      if (allMethodsPresent) {
        return { value: value as T, ok: true }
      }
    }
    return { value: zeroValue as T, ok: false }
  } else if (typeInfo.kind === TypeKind.Basic && typeInfo.jsType) {
    // Check basic type against JavaScript type
    if (typeof value === typeInfo.jsType) {
      return { value: value as T, ok: true }
    }
    return { value: zeroValue as T, ok: false }
  }

  // For other types or fallback, use the general matching function
  const matches = matchesType(value, typeInfo)

  return {
    value: matches ? (value as T) : (zeroValue as T),
    ok: matches,
  }
}

/**
 * Represents the result of a channel receive operation with 'ok' value
 */
export interface ChannelReceiveResult<T> {
  value: T // Should be T | ZeroValue<T>
  ok: boolean
}

/**
 * Represents a result from a select operation
 */
export interface SelectResult<T> {
  value: T // Should be T | ZeroValue<T>
  ok: boolean
  id: number
}

/**
 * Represents a Go channel in TypeScript.
 * Supports asynchronous sending and receiving of values.
 */
export interface Channel<T> {
  /**
   * Sends a value to the channel.
   * Returns a promise that resolves when the value is accepted by the channel.
   * @param value The value to send.
   */
  send(value: T): Promise<void>

  /**
   * Receives a value from the channel.
   * Returns a promise that resolves with the received value.
   * If the channel is closed, it throws an error.
   */
  receive(): Promise<T>

  /**
   * Receives a value from the channel along with a boolean indicating
   * whether the channel is still open.
   * Returns a promise that resolves with {value, ok}.
   * - If channel is open and has data: {value: <data>, ok: true}
   * - If channel is closed and empty: {value: <zero value>, ok: false}
   * - If channel is closed but has remaining buffered data: {value: <data>, ok: true}
   */
  receiveWithOk(): Promise<ChannelReceiveResult<T>>

  /**
   * Closes the channel.
   * No more values can be sent to a closed channel.
   * Receive operations on a closed channel return the zero value and ok=false.
   */
  close(): void

  /**
   * Used in select statements to create a receive operation promise.
   * @param id An identifier for this case in the select statement
   * @returns Promise that resolves when this case is selected
   */
  selectReceive(id: number): Promise<SelectResult<T>>

  /**
   * Used in select statements to create a send operation promise.
   * @param value The value to send
   * @param id An identifier for this case in the select statement
   * @returns Promise that resolves when this case is selected
   */
  selectSend(value: T, id: number): Promise<SelectResult<boolean>>

  /**
   * Checks if the channel has data ready to be received without blocking.
   * Used for non-blocking select operations.
   */
  canReceiveNonBlocking(): boolean

  /**
   * Checks if the channel can accept a send operation without blocking.
   * Used for non-blocking select operations.
   */
  canSendNonBlocking(): boolean
}

// A simple implementation of buffered channels
class BufferedChannel<T> implements Channel<T> {
  private buffer: T[] = []
  private closed: boolean = false
  private capacity: number
  private senders: Array<(value: boolean) => void> = [] // Resolvers for blocked senders
  private receivers: Array<(value: T) => void> = [] // Resolvers for blocked receivers
  private receiversWithOk: Array<(result: ChannelReceiveResult<T>) => void> = [] // For receive with ok
  private zeroValue: T // Store the zero value for the element type

  constructor(capacity: number, zeroValue: T) {
    this.capacity = capacity
    this.zeroValue = zeroValue
  }

  async send(value: T): Promise<void> {
    if (this.closed) {
      throw new Error('send on closed channel')
    }

    // If there are waiting receivers, directly pass the value
    if (this.receivers.length > 0) {
      const receiver = this.receivers.shift()!
      receiver(value)
      return
    }

    // If there are waiting receivers with ok, directly pass the value and ok=true
    if (this.receiversWithOk.length > 0) {
      const receiver = this.receiversWithOk.shift()!
      receiver({ value, ok: true })
      return
    }

    // If buffer is not full, add to buffer
    if (this.buffer.length < this.capacity) {
      this.buffer.push(value)
      return
    }

    // Buffer is full, block the sender
    return new Promise<void>((resolve, reject) => {
      this.senders.push((success: boolean) => {
        if (success) {
          this.buffer.push(value)
          resolve()
        } else {
          reject(new Error('send on closed channel'))
        }
      })
    })
  }

  async receive(): Promise<T> {
    // If buffer has values, return from buffer
    if (this.buffer.length > 0) {
      const value = this.buffer.shift()!

      // If there are waiting senders, unblock one
      if (this.senders.length > 0) {
        const sender = this.senders.shift()!
        sender(true) // Unblock with success
      }

      return value
    }

    // If channel is closed and buffer is empty, throw error (receive without ok)
    if (this.closed) {
      throw new Error('receive on closed channel')
    }

    // Buffer is empty, block the receiver
    return new Promise<T>((resolve) => {
      this.receivers.push(resolve)
    })
  }

  async receiveWithOk(): Promise<ChannelReceiveResult<T>> {
    // If buffer has values, return from buffer with ok=true
    if (this.buffer.length > 0) {
      const value = this.buffer.shift()!

      // If there are waiting senders, unblock one
      if (this.senders.length > 0) {
        const sender = this.senders.shift()!
        sender(true) // Unblock with success
      }

      return { value, ok: true }
    }

    // If channel is closed and buffer is empty, return zero value with ok=false
    if (this.closed) {
      return { value: this.zeroValue, ok: false } // Return zeroValue
    }

    // Buffer is empty, block the receiver with ok
    return new Promise<ChannelReceiveResult<T>>((resolve) => {
      this.receiversWithOk.push(resolve)
    })
  }

  async selectReceive(id: number): Promise<SelectResult<T>> {
    // If buffer has values, return from buffer with ok=true
    if (this.buffer.length > 0) {
      const value = this.buffer.shift()!

      // If there are waiting senders, unblock one
      if (this.senders.length > 0) {
        const sender = this.senders.shift()!
        sender(true) // Unblock with success
      }

      return { value, ok: true, id }
    }

    // If channel is closed and buffer is empty, return zero value with ok=false
    if (this.closed) {
      return { value: this.zeroValue, ok: false, id } // Return zeroValue
    }

    // Buffer is empty, return a promise that will be resolved when a value is available
    return new Promise<SelectResult<T>>((resolve) => {
      this.receiversWithOk.push((result) => {
        resolve({ ...result, id })
      })
    })
  }

  async selectSend(value: T, id: number): Promise<SelectResult<boolean>> {
    if (this.closed) {
      return { value: false, ok: false, id }
    }

    // If there are waiting receivers, directly pass the value
    if (this.receivers.length > 0) {
      const receiver = this.receivers.shift()!
      receiver(value)
      return { value: true, ok: true, id }
    }

    // If there are waiting receivers with ok, directly pass the value and ok=true
    if (this.receiversWithOk.length > 0) {
      const receiver = this.receiversWithOk.shift()!
      receiver({ value, ok: true })
      return { value: true, ok: true, id }
    }

    // If buffer is not full, add to buffer
    if (this.buffer.length < this.capacity) {
      this.buffer.push(value)
      return { value: true, ok: true, id }
    }

    // Buffer is full, return a promise that will be resolved when buffer space is available
    return new Promise<SelectResult<boolean>>((resolve) => {
      this.senders.push((success: boolean) => {
        if (success) {
          this.buffer.push(value)
          resolve({ value: true, ok: true, id })
        } else {
          resolve({ value: false, ok: false, id })
        }
      })
    })
  }

  close(): void {
    if (this.closed) {
      throw new Error('close of closed channel')
    }

    this.closed = true

    // Unblock all waiting senders with failure
    for (const sender of this.senders) {
      sender(false)
    }
    this.senders = []

    // Unblock all waiting receivers with the zero value
    for (const receiver of this.receivers) {
      // Note: receive() without ok throws on closed channel, this unblocking should not happen in correct Go logic
      // but for safety, we'll resolve with zero value if it somehow does.
      receiver(this.zeroValue)
    }
    this.receivers = []

    // Unblock all waiting receivers with ok=false and zero value
    for (const receiver of this.receiversWithOk) {
      receiver({ value: this.zeroValue, ok: false })
    }
    this.receiversWithOk = []
  }

  /**
   * Checks if the channel has data ready to be received without blocking.
   * Used for non-blocking select operations.
   */
  canReceiveNonBlocking(): boolean {
    return this.buffer.length > 0 || this.closed
  }

  /**
   * Checks if the channel can accept a send operation without blocking.
   * Used for non-blocking select operations.
   */
  canSendNonBlocking(): boolean {
    return !this.closed && this.buffer.length < this.capacity
  }
}

/**
 * Represents a case in a select statement.
 */
export interface SelectCase<T> {
  id: number
  isSend: boolean // true for send, false for receive
  channel: Channel<any> | null // Allow null
  value?: any // Value to send for send cases
  // Optional handlers for when this case is selected
  onSelected?: (result: SelectResult<T>) => Promise<void>
}

/**
 * Helper for 'select' statements. Takes an array of select cases
 * and resolves when one of them completes, following Go's select rules.
 *
 * @param cases Array of SelectCase objects
 * @param hasDefault Whether there is a default case
 * @returns A promise that resolves with the result of the selected case
 */
export async function selectStatement<T>(
  cases: SelectCase<T>[],
  hasDefault: boolean = false,
): Promise<void> {
  if (cases.length === 0 && !hasDefault) {
    // Go spec: If there are no cases, the select statement blocks forever.
    // Emulate blocking forever with a promise that never resolves.
    return new Promise<void>(() => {}) // Promise never resolves
  }

  // 1. Check for ready (non-blocking) operations
  const readyCases: SelectCase<T>[] = []
  for (const caseObj of cases) {
    if (caseObj.id === -1) {
      // Skip default case in this check
      continue
    }
    // Add check for channel existence
    if (caseObj.channel) {
      if (caseObj.isSend && caseObj.channel.canSendNonBlocking()) {
        readyCases.push(caseObj)
      } else if (!caseObj.isSend && caseObj.channel.canReceiveNonBlocking()) {
        readyCases.push(caseObj)
      }
    }
  }

  if (readyCases.length > 0) {
    // If one or more cases are ready, choose one pseudo-randomly
    const selectedCase =
      readyCases[Math.floor(Math.random() * readyCases.length)]

    // Execute the selected operation and its onSelected handler
    // Add check for channel existence
    if (selectedCase.channel) {
      if (selectedCase.isSend) {
        const result = await selectedCase.channel.selectSend(
          selectedCase.value,
          selectedCase.id,
        )
        if (selectedCase.onSelected) {
          await selectedCase.onSelected(result as SelectResult<T>) // Await the handler
        }
      } else {
        const result = await selectedCase.channel.selectReceive(selectedCase.id)
        if (selectedCase.onSelected) {
          await selectedCase.onSelected(result) // Await the handler
        }
      }
    } else {
      // This case should ideally not happen if channel is required for non-default cases
      console.error('Selected case without a channel:', selectedCase)
    }
    return // Return after executing a ready case
  }

  // 2. If no operations are ready and there's a default case, select default
  if (hasDefault) {
    // Find the default case (it will have id -1)
    const defaultCase = cases.find((c) => c.id === -1)
    if (defaultCase && defaultCase.onSelected) {
      // Execute the onSelected handler for the default case
      await defaultCase.onSelected({
        value: undefined,
        ok: false,
        id: -1,
      } as SelectResult<T>) // Await the handler
    }
    return // Return after executing the default case
  }

  // 3. If no operations are ready and no default case, block until one is ready
  // Use Promise.race on the blocking promises
  const blockingPromises = cases
    .filter((c) => c.id !== -1)
    .map((caseObj) => {
      // Exclude default case
      // Add check for channel existence (though it should always exist here)
      if (caseObj.channel) {
        if (caseObj.isSend) {
          return caseObj.channel.selectSend(caseObj.value, caseObj.id)
        } else {
          return caseObj.channel.selectReceive(caseObj.id)
        }
      }
      // Return a promise that never resolves if channel is somehow missing
      return new Promise<SelectResult<any>>(() => {})
    })

  const result = await Promise.race(blockingPromises)
  // Execute onSelected handler for the selected case
  const selectedCase = cases.find((c) => c.id === result.id)
  if (selectedCase && selectedCase.onSelected) {
    await selectedCase.onSelected(result) // Await the handler
  }
  // No explicit return needed here, as the function will implicitly return after the await
}

/**
 * Creates a new channel with the specified buffer size and zero value.
 * @param bufferSize The size of the channel buffer. If 0, creates an unbuffered channel.
 * @param zeroValue The zero value for the channel's element type.
 * @returns A new channel instance.
 */
export const makeChannel = <T>(
  bufferSize: number,
  zeroValue: T,
): Channel<T> => {
  return new BufferedChannel<T>(bufferSize, zeroValue)
}

/**
 * DisposableStack manages synchronous disposable resources, mimicking Go's defer behavior.
 * Functions added via `defer` are executed in LIFO order when the stack is disposed.
 * Implements the `Disposable` interface for use with `using` declarations.
 */
export class DisposableStack implements Disposable {
  private stack: (() => void)[] = []

  /**
   * Adds a function to be executed when the stack is disposed.
   * @param fn The function to defer.
   */
  defer(fn: () => void): void {
    this.stack.push(fn)
  }

  /**
   * Disposes of the resources in the stack by executing the deferred functions
   * in Last-In, First-Out (LIFO) order.
   * If a deferred function throws an error, disposal stops, and the error is rethrown,
   * similar to Go's panic behavior during defer execution.
   */
  [Symbol.dispose](): void {
    // Emulate Go: if a deferred throws, stop and rethrow
    while (this.stack.length) {
      const fn = this.stack.pop()!
      fn()
    }
  }
}

/**
 * AsyncDisposableStack manages asynchronous disposable resources, mimicking Go's defer behavior.
 * Functions added via `defer` are executed sequentially in LIFO order when the stack is disposed.
 * Implements the `AsyncDisposable` interface for use with `await using` declarations.
 */
export class AsyncDisposableStack implements AsyncDisposable {
  private stack: (() => Promise<void> | void)[] = []

  /**
   * Adds a synchronous or asynchronous function to be executed when the stack is disposed.
   * @param fn The function to defer. Can return void or a Promise<void>.
   */
  defer(fn: () => Promise<void> | void): void {
    this.stack.push(fn)
  }

  /**
   * Asynchronously disposes of the resources in the stack by executing the deferred functions
   * sequentially in Last-In, First-Out (LIFO) order. It awaits each function if it returns a promise.
   */
  async [Symbol.asyncDispose](): Promise<void> {
    // Execute in LIFO order, awaiting each potentially async function
    for (let i = this.stack.length - 1; i >= 0; --i) {
      await this.stack[i]()
    }
  }
}

/**
 * Implementation of Go's built-in println function
 * @param args Arguments to print
 */
export function println(...args: any[]): void {
  console.log(...args)
}
