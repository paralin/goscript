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
 *
 * Slice<number> can be represented as Uint8Array.
 */
export type Slice<T> =
  | T[]
  | SliceProxy<T>
  | null
  | (T extends number ? Uint8Array : never)

// asArray converts a slice to a JavaScript array.
export function asArray<T>(slice: Slice<T>): T[] {
  if (slice === null || slice === undefined) {
    return []
  }

  if (slice instanceof Uint8Array) {
    return Array.from(slice) as T[]
  }

  if (isComplexSlice(slice)) {
    const result: T[] = []
    for (let i = 0; i < slice.__meta__.length; i++) {
      result.push(slice.__meta__.backing[slice.__meta__.offset + i])
    }
    return result
  }

  if (Array.isArray(slice)) {
    return slice
  }

  return []
}

/**
 * isComplexSlice checks if a slice is a complex slice (has __meta__ property)
 */
function isComplexSlice<T>(slice: Slice<T>): slice is SliceProxy<T> {
  return (
    slice !== null &&
    slice !== undefined &&
    typeof slice === 'object' &&
    '__meta__' in slice &&
    slice.__meta__ !== undefined
  )
}

/**
 * isSliceProxy checks if a slice is a SliceProxy (has __meta__ property)
 * This is an alias for isComplexSlice for better type hinting
 */
export function isSliceProxy<T>(slice: Slice<T>): slice is SliceProxy<T> {
  return isComplexSlice(slice)
}

/**
 * Creates a new slice with the specified length and capacity.
 * @param length The length of the slice.
 * @param capacity The capacity of the slice (optional).
 * @returns A new slice.
 */
export const makeSlice = <T>(
  length: number,
  capacity?: number,
  typeHint?: string,
): Slice<T> => {
  if (typeHint === 'byte') {
    // Uint8Array is initialized to zeros by default.
    // Capacity for Uint8Array is its length.
    return new Uint8Array(length) as Slice<T>
  }

  const actualCapacity = capacity === undefined ? length : capacity
  if (length < 0 || actualCapacity < 0 || length > actualCapacity) {
    throw new Error(
      `Invalid slice length (${length}) or capacity (${actualCapacity})`,
    )
  }

  let zeroVal: any
  switch (typeHint) {
    case 'number':
      zeroVal = 0
      break
    case 'boolean':
      zeroVal = false
      break
    case 'string':
      zeroVal = ''
      break
    default:
      zeroVal = null // Default for objects, complex types, or unspecified
  }

  const backingArr = new Array<T>(actualCapacity)
  // Initialize the relevant part of the backing array
  for (let i = 0; i < length; i++) {
    backingArr[i] = zeroVal
  }
  // The rest of backingArr (from length to actualCapacity-1) remains uninitialized (undefined),
  // representing available capacity.

  // The proxyTargetArray serves as the shell for the proxy.
  // Its elements up to 'length' should reflect the initialized part of the slice.
  const proxyTargetArray = new Array<T>(length)
  for (let i = 0; i < length; i++) {
    proxyTargetArray[i] = backingArr[i] // Or simply zeroVal
  }

  const proxy = proxyTargetArray as SliceProxy<T>
  proxy.__meta__ = {
    backing: backingArr,
    offset: 0,
    length: length,
    capacity: actualCapacity,
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
export const goSlice = <T>( // T can be number for Uint8Array case
  s: Slice<T>,
  low?: number,
  high?: number,
  max?: number,
): Slice<T> => {
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

  if (s instanceof Uint8Array) {
    const actualLow = low ?? 0
    const actualHigh = high ?? s.length

    if (actualLow < 0 || actualHigh < actualLow || actualHigh > s.length) {
      throw new Error(
        `Invalid slice indices: low ${actualLow}, high ${actualHigh} for Uint8Array of length ${s.length}`,
      )
    }

    const subArrayView = s.subarray(actualLow, actualHigh) // This is Uint8Array

    if (max !== undefined) {
      if (max < actualHigh || max > s.length) {
        // max is relative to the original s.length (capacity)
        throw new Error(
          `Invalid max index: ${max}. Constraints: low ${actualLow} <= high ${actualHigh} <= max <= original_length ${s.length}`,
        )
      }

      const newLength = subArrayView.length // actualHigh - actualLow
      const newCap = max - actualLow // Capacity of the new slice view

      if (newCap !== newLength) {
        // Capacity is different from length, so return SliceProxy<number>
        // The original s was Uint8Array, so T is effectively 'number' for this path.
        const backingNumbers = Array.from(subArrayView) // Convert Uint8Array data to number[]

        const proxyTarget = {
          __meta__: {
            backing: backingNumbers, // number[]
            offset: 0, // Offset is 0 because backingNumbers is a direct copy
            length: newLength,
            capacity: newCap,
          },
        }
        // Explicitly cast to Slice<T> after ensuring T is number for this branch.
        return new Proxy(
          proxyTarget,
          handler,
        ) as unknown as SliceProxy<number> as Slice<T>
      } else {
        // newCap === newLength, standard Uint8Array is fine.
        return subArrayView as Slice<T> // T is number
      }
    } else {
      // max is not defined, return the Uint8Array subarray view directly.
      return subArrayView as Slice<T> // T is number
    }
  }

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

  // const handler = { ... } // Handler is now defined at the top

  return new Proxy(target, handler) as unknown as SliceProxy<T>
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
): Slice<T> => {
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
      if (!isComplexSlice(item as any) && Array.isArray(item)) {
        arr[i] = arrayToSlice(item as any[], depth - 1) as any
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
  obj:
    | string
    | Array<T>
    | Slice<T>
    | Map<T, V>
    | Set<T>
    | Uint8Array
    | null
    | undefined,
): number => {
  if (obj === null || obj === undefined) {
    return 0
  }

  if (typeof obj === 'string') {
    return stringLen(obj) // Call new stringLen for strings
  }

  if (obj instanceof Map || obj instanceof Set) {
    return obj.size
  }

  if (obj instanceof Uint8Array) {
    return obj.length
  }

  if (isComplexSlice(obj)) {
    return obj.__meta__.length
  }

  if (Array.isArray(obj)) {
    return obj.length
  }

  throw new Error('cannot determine len of this type')
}

/**
 * Returns the capacity of a slice.
 * @param obj The slice.
 * @returns The capacity of the slice.
 */
export const cap = <T>(obj: Slice<T> | Uint8Array): number => {
  if (obj === null || obj === undefined) {
    return 0
  }

  if (obj instanceof Uint8Array) {
    return obj.length // Uint8Array capacity is its length
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
export const append = <T>(
  slice: Slice<T> | Uint8Array,
  ...elements: any[]
): Slice<T> => {
  // 1. Flatten all elements from the varargs `...elements` into `varargsElements`.
  // Determine if the result should be a Uint8Array.
  const inputIsUint8Array = slice instanceof Uint8Array
  const appendingUint8Array = elements.some((el) => el instanceof Uint8Array)
  const produceUint8Array =
    inputIsUint8Array ||
    appendingUint8Array ||
    (slice === null && appendingUint8Array)

  // If producing Uint8Array, all elements must be numbers and potentially flattened from other Uint8Arrays/number slices.
  if (produceUint8Array) {
    let combinedBytes: number[] = []
    // Add bytes from the original slice if it exists and is numeric.
    if (inputIsUint8Array) {
      combinedBytes.push(...Array.from(slice as Uint8Array))
    } else if (slice !== null && slice !== undefined) {
      // Original was Slice<number> or number[]
      const sliceLen = len(slice)
      for (let i = 0; i < sliceLen; i++) {
        const val = (slice as any)[i]
        if (typeof val !== 'number') {
          throw new Error(
            'Cannot produce Uint8Array: original slice contains non-number elements.',
          )
        }
        combinedBytes.push(val)
      }
    }
    // Add bytes from the varargs elements.
    // For Uint8Array, elements are always flattened if they are slices/Uint8Arrays.
    for (const item of elements) {
      if (item instanceof Uint8Array) {
        combinedBytes.push(...Array.from(item))
      } else if (isComplexSlice(item) || Array.isArray(item)) {
        const itemLen = len(item as Slice<any>)
        for (let i = 0; i < itemLen; i++) {
          const val = (item as any)[i]
          if (typeof val !== 'number') {
            throw new Error(
              'Cannot produce Uint8Array: appended elements contain non-numbers.',
            )
          }
          combinedBytes.push(val)
        }
      } else {
        if (typeof item !== 'number') {
          throw new Error(
            'Cannot produce Uint8Array: appended elements contain non-numbers.',
          )
        }
        combinedBytes.push(item)
      }
    }
    const newArr = new Uint8Array(combinedBytes.length)
    newArr.set(combinedBytes)
    return newArr as Slice<T>
  }

  // Handle generic Slice<T> (non-Uint8Array result).
  // In this case, `elements` are treated as individual items to append,
  // as the Go transpiler is responsible for spreading (`...`) if needed.
  const numAdded = elements.length

  if (numAdded === 0) {
    return slice
  }

  let originalElements: T[] = []
  let oldCapacity: number
  let isOriginalComplex = false
  let originalBacking: T[] | undefined = undefined
  let originalOffset = 0

  if (slice === null || slice === undefined) {
    oldCapacity = 0
  } else if (isComplexSlice(slice)) {
    const meta = slice.__meta__
    for (let i = 0; i < meta.length; i++)
      originalElements.push(meta.backing[meta.offset + i])
    oldCapacity = meta.capacity
    isOriginalComplex = true
    originalBacking = meta.backing
    originalOffset = meta.offset
  } else {
    // Simple T[] array
    originalElements = (slice as T[]).slice()
    oldCapacity = (slice as T[]).length
  }
  const oldLength = originalElements.length
  const newLength = oldLength + numAdded

  // Case 1: Modify in-place if original was SliceProxy and has enough capacity.
  if (isOriginalComplex && newLength <= oldCapacity && originalBacking) {
    for (let i = 0; i < numAdded; i++) {
      originalBacking[originalOffset + oldLength + i] = elements[i] as T
    }
    const resultProxy = new Array(newLength) as SliceProxy<T>
    for (let i = 0; i < newLength; i++)
      resultProxy[i] = originalBacking[originalOffset + i]
    resultProxy.__meta__ = {
      backing: originalBacking,
      offset: originalOffset,
      length: newLength,
      capacity: oldCapacity,
    }
    return resultProxy
  }

  // Case 2: Reallocation is needed.
  let newCapacity = oldCapacity
  if (newCapacity === 0) {
    newCapacity = newLength
  } else if (oldLength < 1024) {
    newCapacity = Math.max(oldCapacity * 2, newLength)
  } else {
    newCapacity = Math.max(oldCapacity + Math.floor(oldCapacity / 4), newLength)
  }
  if (newCapacity < newLength) {
    newCapacity = newLength
  }

  const newBacking = new Array<T>(newCapacity)
  for (let i = 0; i < oldLength; i++) {
    newBacking[i] = originalElements[i]
  }
  for (let i = 0; i < numAdded; i++) {
    newBacking[oldLength + i] = elements[i] as T
  }

  const resultProxy = new Array(newLength) as SliceProxy<T>
  for (let i = 0; i < newLength; i++) resultProxy[i] = newBacking[i]
  resultProxy.__meta__ = {
    backing: newBacking,
    offset: 0,
    length: newLength,
    capacity: newCapacity,
  }
  return resultProxy
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

  const isDstUint8Array = dst instanceof Uint8Array
  const isSrcUint8Array = src instanceof Uint8Array

  if (isDstUint8Array && isSrcUint8Array) {
    ;(dst as Uint8Array).set((src as Uint8Array).subarray(0, count))
  } else if (isDstUint8Array) {
    // dst is Uint8Array, src is Slice<number> or number[]
    const dstUint8 = dst as Uint8Array
    if (isComplexSlice(src)) {
      const srcMeta = (src as SliceProxy<number>).__meta__
      for (let i = 0; i < count; i++) {
        dstUint8[i] = srcMeta.backing[srcMeta.offset + i]
      }
    } else {
      // src is number[]
      const srcArray = src as number[]
      for (let i = 0; i < count; i++) {
        dstUint8[i] = srcArray[i]
      }
    }
  } else if (isSrcUint8Array) {
    // src is Uint8Array, dst is Slice<number> or number[]
    const srcUint8 = src as Uint8Array
    if (isComplexSlice(dst)) {
      const dstMeta = (dst as SliceProxy<number>).__meta__
      const dstBacking = dstMeta.backing
      const dstOffset = dstMeta.offset
      for (let i = 0; i < count; i++) {
        dstBacking[dstOffset + i] = srcUint8[i]
        // Also update the proxy view if dst is a proxy
        ;(dst as any)[i] = srcUint8[i]
      }
    } else {
      // dst is number[]
      const dstArray = dst as number[]
      for (let i = 0; i < count; i++) {
        dstArray[i] = srcUint8[i]
      }
    }
  } else {
    // Both are Slice<T> or T[] (original logic)
    if (isComplexSlice(dst)) {
      const dstOffset = (dst as SliceProxy<T>).__meta__.offset
      const dstBacking = (dst as SliceProxy<T>).__meta__.backing

      if (isComplexSlice(src)) {
        const srcOffset = (src as SliceProxy<T>).__meta__.offset
        const srcBacking = (src as SliceProxy<T>).__meta__.backing
        for (let i = 0; i < count; i++) {
          dstBacking[dstOffset + i] = srcBacking[srcOffset + i]
          ;(dst as any)[i] = srcBacking[srcOffset + i] // Update proxy
        }
      } else {
        // src is T[]
        const srcArray = src as T[]
        for (let i = 0; i < count; i++) {
          dstBacking[dstOffset + i] = srcArray[i]
          ;(dst as any)[i] = srcArray[i] // Update proxy
        }
      }
    } else {
      // dst is T[]
      const dstArray = dst as T[]
      if (isComplexSlice(src)) {
        const srcOffset = (src as SliceProxy<T>).__meta__.offset
        const srcBacking = (src as SliceProxy<T>).__meta__.backing
        for (let i = 0; i < count; i++) {
          dstArray[i] = srcBacking[srcOffset + i]
        }
      } else {
        // src is T[]
        const srcArray = src as T[]
        for (let i = 0; i < count; i++) {
          dstArray[i] = srcArray[i]
        }
      }
    }
  }
  return count
}

/**
 * Accesses an element at a specific index for various Go-like types (string, slice, array).
 * Mimics Go's indexing behavior: `myCollection[index]`
 * For strings, it returns the byte value at the specified byte index.
 * For slices/arrays, it returns the element at the specified index.
 * This is used when dealing with types like "string | []byte"
 * @param collection The string, Slice, or Array to access.
 * @param index The index.
 * @returns The element or byte value at the specified index.
 * @throws Error if index is out of bounds or type is unsupported.
 */
export function index<T>(
  collection: string | Slice<T> | T[],
  index: number,
): T | number {
  if (collection === null || collection === undefined) {
    throw new Error('runtime error: index on nil or undefined collection')
  }

  if (typeof collection === 'string') {
    return indexString(collection, index) // Use the existing indexString for byte access
  } else if (collection instanceof Uint8Array) {
    if (index < 0 || index >= collection.length) {
      throw new Error(
        `runtime error: index out of range [${index}] with length ${collection.length}`,
      )
    }
    return collection[index]
  } else if (isComplexSlice(collection)) {
    if (index < 0 || index >= collection.__meta__.length) {
      throw new Error(
        `runtime error: index out of range [${index}] with length ${collection.__meta__.length}`,
      )
    }
    return collection.__meta__.backing[collection.__meta__.offset + index]
  } else if (Array.isArray(collection)) {
    if (index < 0 || index >= collection.length) {
      throw new Error(
        `runtime error: index out of range [${index}] with length ${collection.length}`,
      )
    }
    return collection[index]
  }
  throw new Error('runtime error: index on unsupported type')
}

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

/**
 * Accesses the byte value at a specific index of a UTF-8 encoded string.
 * Mimics Go's string indexing behavior: `myString[index]`
 * @param str The string to access.
 * @param index The byte index.
 * @returns The byte value (0-255) at the specified index.
 * @throws Error if index is out of bounds.
 */
export const indexString = (str: string, index: number): number => {
  const bytes = new TextEncoder().encode(str)
  if (index < 0 || index >= bytes.length) {
    throw new Error(
      `runtime error: index out of range [${index}] with length ${bytes.length}`,
    )
  }
  return bytes[index]
}

/**
 * Returns the byte length of a string.
 * Mimics Go's `len(string)` behavior.
 * @param str The string.
 * @returns The number of bytes in the UTF-8 representation of the string.
 */
export const stringLen = (str: string): number => {
  return new TextEncoder().encode(str).length
}

/**
 * Slices a string based on byte indices.
 * Mimics Go's string slicing behavior: `myString[low:high]` for valid UTF-8 slices only.
 * @param str The string to slice.
 * @param low The starting byte index (inclusive). Defaults to 0.
 * @param high The ending byte index (exclusive). Defaults to string byte length.
 * @returns The sliced string.
 * @throws Error if the slice would create invalid UTF-8.
 */
export const sliceString = (
  str: string,
  low?: number,
  high?: number,
): string => {
  const bytes = new TextEncoder().encode(str)
  const actualLow = low === undefined ? 0 : low
  const actualHigh = high === undefined ? bytes.length : high

  if (actualLow < 0 || actualHigh < actualLow || actualHigh > bytes.length) {
    // Go's behavior for out-of-bounds slice on string is a panic.
    // For simple slices like s[len(s):len(s)], it should produce an empty string.
    // For s[len(s)+1:], it panics.
    // Let's ensure high <= bytes.length and low <= high.
    // If low == high, it's an empty string.
    if (
      actualLow === actualHigh &&
      actualLow >= 0 &&
      actualLow <= bytes.length
    ) {
      return ''
    }
    throw new Error(
      `runtime error: slice bounds out of range [${actualLow}:${actualHigh}] with length ${bytes.length}`,
    )
  }

  const slicedBytes = bytes.subarray(actualLow, actualHigh)

  try {
    // Attempt to decode with strict UTF-8 validation
    const result = new TextDecoder('utf-8', { fatal: true }).decode(slicedBytes)
    return result
  } catch (_e) {
    //eslint-disable-line @typescript-eslint/no-unused-vars
    // If we get here, the slice would create invalid UTF-8
    // This is a fundamental limitation of JavaScript string handling
    throw new Error(
      `Cannot slice string at byte indices [${actualLow}:${actualHigh}] because it would create invalid UTF-8. ` +
        `This is a limitation of JavaScript's string handling.`,
    )
  }
}

/**
 * Converts a Slice<number> (byte array) to a string using TextDecoder.
 * @param bytes The Slice<number> to convert.
 * @returns The resulting string.
 */
export const bytesToString = (
  bytes: Slice<number> | Uint8Array | string,
): string => {
  if (bytes === null) return ''
  // If it's already a string, just return it
  if (typeof bytes === 'string') return bytes
  if (bytes instanceof Uint8Array) {
    return new TextDecoder().decode(bytes)
  }
  // Ensure we get a plain number[] for Uint8Array.from
  let byteArray: number[]
  if (isComplexSlice(bytes)) {
    // For complex slices, extract the relevant part of the backing array
    byteArray = bytes.__meta__.backing.slice(
      bytes.__meta__.offset,
      bytes.__meta__.offset + bytes.__meta__.length,
    )
  } else {
    // For simple T[] slices
    byteArray = bytes
  }
  return new TextDecoder().decode(Uint8Array.from(byteArray))
}

/**
 * Converts a string to a Uint8Array (byte slice).
 * @param s The input string.
 * @returns A Uint8Array representing the UTF-8 bytes of the string.
 */
export function stringToBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s)
}

/**
 * Handles string() conversion for values that could be either string or []byte.
 * Used for generic type parameters with constraint []byte|string.
 * @param value Value that is either a string or Uint8Array
 * @returns The string representation
 */
export function genericBytesOrStringToString(
  value: string | Uint8Array,
): string {
  if (typeof value === 'string') {
    return value
  }
  return bytesToString(value as unknown as number[])
}

/**
 * Indexes into a value that could be either a string or bytes.
 * Used for generic type parameters with constraint string | []byte.
 * Both cases return a byte value (number).
 * @param value Value that is either a string or bytes (Uint8Array or Slice<number>)
 * @param index The index to access
 * @returns The byte value at the specified index
 */
export function indexStringOrBytes(
  value: string | import('./builtin.js').Bytes,
  index: number,
): number {
  if (typeof value === 'string') {
    return indexString(value, index)
  } else if (value instanceof Uint8Array) {
    // For Uint8Array, direct access returns the byte value
    if (index < 0 || index >= value.length) {
      throw new Error(
        `runtime error: index out of range [${index}] with length ${value.length}`,
      )
    }
    return value[index]
  } else if (value === null) {
    throw new Error(
      `runtime error: index out of range [${index}] with length 0`,
    )
  } else {
    // For Slice<number> (including SliceProxy)
    const length = len(value)
    if (index < 0 || index >= length) {
      throw new Error(
        `runtime error: index out of range [${index}] with length ${length}`,
      )
    }
    return (value as any)[index] as number
  }
}

/**
 * Slices a value that could be either a string or bytes.
 * Used for generic type parameters with constraint string | []byte.
 * @param value Value that is either a string or bytes (Uint8Array or Slice<number>)
 * @param low Starting index (inclusive). Defaults to 0.
 * @param high Ending index (exclusive). Defaults to length.
 * @param max Capacity limit (only used for bytes, ignored for strings)
 * @returns The sliced value of the same type as input
 */
export function sliceStringOrBytes<
  T extends string | import('./builtin.js').Bytes,
>(value: T, low?: number, high?: number, max?: number): T {
  if (typeof value === 'string') {
    // For strings, use sliceString and ignore max parameter
    return sliceString(value, low, high) as T
  } else {
    // For bytes (Uint8Array or Slice<number>), use goSlice
    return goSlice(value as Slice<number>, low, high, max) as T
  }
}
