/**
 * Implementation of Go's built-in println function
 * @param args Arguments to print
 */
export function println(...args: any[]): void {
  console.log(...args)
}

/**
 * Implementation of Go's built-in panic function
 * @param args Arguments passed to panic
 */
export function panic(...args: any[]): void {
  throw new Error(`panic: ${args.map((arg) => String(arg)).join(' ')}`)
}

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
export type Slice<T> = T[] | SliceProxy<T> | null | (T extends number ? Uint8Array : never)

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
    typeof slice === 'object' &&
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
export const makeSlice = <T>(length: number, capacity?: number, typeHint?: string): Slice<T> => {
  if (typeHint === "byte") {
    // Uint8Array is initialized to zeros by default.
    // Capacity for Uint8Array is its length.
    return new Uint8Array(length) as Slice<T>;
  }

  const actualCapacity = capacity === undefined ? length : capacity;
  if (length < 0 || actualCapacity < 0 || length > actualCapacity) {
    throw new Error(
      `Invalid slice length (${length}) or capacity (${actualCapacity})`,
    );
  }

  let zeroVal: any;
  switch (typeHint) {
    case "number": zeroVal = 0; break;
    case "boolean": zeroVal = false; break;
    case "string": zeroVal = ""; break;
    default: zeroVal = null; // Default for objects, complex types, or unspecified
  }

  const backingArr = new Array<T>(actualCapacity);
  // Initialize the relevant part of the backing array
  for (let i = 0; i < length; i++) {
    backingArr[i] = zeroVal;
  }
  // The rest of backingArr (from length to actualCapacity-1) remains uninitialized (undefined),
  // representing available capacity.

  // The proxyTargetArray serves as the shell for the proxy.
  // Its elements up to 'length' should reflect the initialized part of the slice.
  const proxyTargetArray = new Array<T>(length);
  for (let i = 0; i < length; i++) {
    proxyTargetArray[i] = backingArr[i]; // Or simply zeroVal
  }

  const proxy = proxyTargetArray as SliceProxy<T>;
  proxy.__meta__ = {
    backing: backingArr,
    offset: 0,
    length: length,
    capacity: actualCapacity,
  };

  return proxy;
};

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
  };

  if (s instanceof Uint8Array) {
    const actualLow = low ?? 0;
    const actualHigh = high ?? s.length;

    if (actualLow < 0 || actualHigh < actualLow || actualHigh > s.length) {
      throw new Error(`Invalid slice indices: low ${actualLow}, high ${actualHigh} for Uint8Array of length ${s.length}`);
    }

    const subArrayView = s.subarray(actualLow, actualHigh); // This is Uint8Array

    if (max !== undefined) {
      if (max < actualHigh || max > s.length) { // max is relative to the original s.length (capacity)
        throw new Error(`Invalid max index: ${max}. Constraints: low ${actualLow} <= high ${actualHigh} <= max <= original_length ${s.length}`);
      }

      const newLength = subArrayView.length; // actualHigh - actualLow
      const newCap = max - actualLow; // Capacity of the new slice view

      if (newCap !== newLength) {
        // Capacity is different from length, so return SliceProxy<number>
        // The original s was Uint8Array, so T is effectively 'number' for this path.
        const backingNumbers = Array.from(subArrayView); // Convert Uint8Array data to number[]

        const proxyTarget = {
          __meta__: {
            backing: backingNumbers, // number[]
            offset: 0, // Offset is 0 because backingNumbers is a direct copy
            length: newLength,
            capacity: newCap,
          },
        };
        // Explicitly cast to Slice<T> after ensuring T is number for this branch.
        return new Proxy(proxyTarget, handler) as unknown as SliceProxy<number> as Slice<T>;
      } else {
        // newCap === newLength, standard Uint8Array is fine.
        return subArrayView as Slice<T>; // T is number
      }
    } else {
      // max is not defined, return the Uint8Array subarray view directly.
      return subArrayView as Slice<T>; // T is number
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
  obj: string | Array<T> | Slice<T> | Map<T, V> |
   Set<T> | Uint8Array | null | undefined,
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

  throw new Error("cannot determine len of this type")
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
    return obj.length; // Uint8Array capacity is its length
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
export const append = <T>(slice: Slice<T> | Uint8Array, ...elements: any[]): Slice<T> => {
  // 1. Flatten all elements from the varargs `...elements` into `varargsElements`.
  // Determine if the result should be a Uint8Array.
  const inputIsUint8Array = slice instanceof Uint8Array;
  const appendingUint8Array = elements.some(el => el instanceof Uint8Array);
  const produceUint8Array = inputIsUint8Array || appendingUint8Array || (slice === null && appendingUint8Array);

  // If producing Uint8Array, all elements must be numbers and potentially flattened from other Uint8Arrays/number slices.
  if (produceUint8Array) {
    let combinedBytes: number[] = [];
    // Add bytes from the original slice if it exists and is numeric.
    if (inputIsUint8Array) {
      combinedBytes.push(...Array.from(slice as Uint8Array));
    } else if (slice !== null && slice !== undefined) { // Original was Slice<number> or number[]
      const sliceLen = len(slice);
      for (let i = 0; i < sliceLen; i++) {
        const val = (slice as any)[i];
        if (typeof val !== 'number') {
          throw new Error("Cannot produce Uint8Array: original slice contains non-number elements.");
        }
        combinedBytes.push(val);
      }
    }
    // Add bytes from the varargs elements.
    // For Uint8Array, elements are always flattened if they are slices/Uint8Arrays.
    for (const item of elements) {
      if (item instanceof Uint8Array) {
        combinedBytes.push(...Array.from(item));
      } else if (isComplexSlice(item) || Array.isArray(item)) {
        const itemLen = len(item as Slice<any>);
        for (let i = 0; i < itemLen; i++) {
          const val = (item as any)[i];
          if (typeof val !== 'number') {
            throw new Error("Cannot produce Uint8Array: appended elements contain non-numbers.");
          }
          combinedBytes.push(val);
        }
      } else {
        if (typeof item !== 'number') {
          throw new Error("Cannot produce Uint8Array: appended elements contain non-numbers.");
        }
        combinedBytes.push(item);
      }
    }
    const newArr = new Uint8Array(combinedBytes.length);
    newArr.set(combinedBytes);
    return newArr as Slice<T>;
  }

  // Handle generic Slice<T> (non-Uint8Array result).
  // In this case, `elements` are treated as individual items to append,
  // as the Go transpiler is responsible for spreading (`...`) if needed.
  const numAdded = elements.length;

  if (numAdded === 0) {
    return slice;
  }

  let originalElements: T[] = [];
  let oldCapacity: number;
  let isOriginalComplex = false;
  let originalBacking: T[] | undefined = undefined;
  let originalOffset = 0;

  if (slice === null || slice === undefined) {
    oldCapacity = 0;
  } else if (isComplexSlice(slice)) {
    const meta = slice.__meta__;
    for(let i=0; i < meta.length; i++) originalElements.push(meta.backing[meta.offset + i]);
    oldCapacity = meta.capacity;
    isOriginalComplex = true;
    originalBacking = meta.backing;
    originalOffset = meta.offset;
  } else { // Simple T[] array
    originalElements = (slice as T[]).slice();
    oldCapacity = (slice as T[]).length;
  }
  const oldLength = originalElements.length;
  const newLength = oldLength + numAdded;

  // Case 1: Modify in-place if original was SliceProxy and has enough capacity.
  if (isOriginalComplex && newLength <= oldCapacity && originalBacking) {
    for (let i = 0; i < numAdded; i++) {
      originalBacking[originalOffset + oldLength + i] = elements[i] as T;
    }
    const resultProxy = new Array(newLength) as SliceProxy<T>;
    for(let i=0; i<newLength; i++) resultProxy[i] = originalBacking[originalOffset + i];
    resultProxy.__meta__ = {
        backing: originalBacking,
        offset: originalOffset,
        length: newLength,
        capacity: oldCapacity,
    };
    return resultProxy;
  }

  // Case 2: Reallocation is needed.
  let newCapacity = oldCapacity;
  if (newCapacity === 0) {
    newCapacity = newLength;
  } else if (oldLength < 1024) {
    newCapacity = Math.max(oldCapacity * 2, newLength);
  } else {
    newCapacity = Math.max(oldCapacity + Math.floor(oldCapacity / 4), newLength);
  }
  if (newCapacity < newLength) {
    newCapacity = newLength;
  }

  const newBacking = new Array<T>(newCapacity);
  for (let i = 0; i < oldLength; i++) {
    newBacking[i] = originalElements[i];
  }
  for (let i = 0; i < numAdded; i++) {
    newBacking[oldLength + i] = elements[i] as T;
  }

  const resultProxy = new Array(newLength) as SliceProxy<T>;
  for(let i=0; i<newLength; i++) resultProxy[i] = newBacking[i];
  resultProxy.__meta__ = {
      backing: newBacking,
      offset: 0,
      length: newLength,
      capacity: newCapacity,
  };
  return resultProxy;
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

  const dstLen = len(dst);
  const srcLen = len(src);
  const count = Math.min(dstLen, srcLen);

  if (count === 0) {
    return 0;
  }

  const isDstUint8Array = dst instanceof Uint8Array;
  const isSrcUint8Array = src instanceof Uint8Array;

  if (isDstUint8Array && isSrcUint8Array) {
    (dst as Uint8Array).set((src as Uint8Array).subarray(0, count));
  } else if (isDstUint8Array) { // dst is Uint8Array, src is Slice<number> or number[]
    const dstUint8 = dst as Uint8Array;
    if (isComplexSlice(src)) {
      const srcMeta = (src as SliceProxy<number>).__meta__;
      for (let i = 0; i < count; i++) {
        dstUint8[i] = srcMeta.backing[srcMeta.offset + i];
      }
    } else { // src is number[]
      const srcArray = src as number[];
      for (let i = 0; i < count; i++) {
        dstUint8[i] = srcArray[i];
      }
    }
  } else if (isSrcUint8Array) { // src is Uint8Array, dst is Slice<number> or number[]
    const srcUint8 = src as Uint8Array;
    if (isComplexSlice(dst)) {
      const dstMeta = (dst as SliceProxy<number>).__meta__;
      const dstBacking = dstMeta.backing;
      const dstOffset = dstMeta.offset;
      for (let i = 0; i < count; i++) {
        dstBacking[dstOffset + i] = srcUint8[i];
        // Also update the proxy view if dst is a proxy
        (dst as any)[i] = srcUint8[i];
      }
    } else { // dst is number[]
      const dstArray = dst as number[];
      for (let i = 0; i < count; i++) {
        dstArray[i] = srcUint8[i];
      }
    }
  } else { // Both are Slice<T> or T[] (original logic)
    if (isComplexSlice(dst)) {
      const dstOffset = (dst as SliceProxy<T>).__meta__.offset;
      const dstBacking = (dst as SliceProxy<T>).__meta__.backing;

      if (isComplexSlice(src)) {
        const srcOffset = (src as SliceProxy<T>).__meta__.offset;
        const srcBacking = (src as SliceProxy<T>).__meta__.backing;
        for (let i = 0; i < count; i++) {
          dstBacking[dstOffset + i] = srcBacking[srcOffset + i];
          (dst as any)[i] = srcBacking[srcOffset + i]; // Update proxy
        }
      } else { // src is T[]
        const srcArray = src as T[];
        for (let i = 0; i < count; i++) {
          dstBacking[dstOffset + i] = srcArray[i];
          (dst as any)[i] = srcArray[i]; // Update proxy
        }
      }
    } else { // dst is T[]
      const dstArray = dst as T[];
      if (isComplexSlice(src)) {
        const srcOffset = (src as SliceProxy<T>).__meta__.offset;
        const srcBacking = (src as SliceProxy<T>).__meta__.backing;
        for (let i = 0; i < count; i++) {
          dstArray[i] = srcBacking[srcOffset + i];
        }
      } else { // src is T[]
        const srcArray = src as T[];
        for (let i = 0; i < count; i++) {
          dstArray[i] = srcArray[i];
        }
      }
    }
  }
  return count;
}

/**
 * Represents the Go error type (interface).
 */
export type GoError = {
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
  } catch (e) {
    // If we get here, the slice would create invalid UTF-8
    // This is a fundamental limitation of JavaScript string handling
    throw new Error(
      `Cannot slice string at byte indices [${actualLow}:${actualHigh}] because it would create invalid UTF-8. ` +
      `This is a limitation of JavaScript's string handling.`
    )
  }
}

/**
 * Converts a Slice<number> (byte array) to a string using TextDecoder.
 * @param bytes The Slice<number> to convert.
 * @returns The resulting string.
 */
export const bytesToString = (bytes: Slice<number> | Uint8Array): string => {
  if (bytes === null) return ''
  if (bytes instanceof Uint8Array) {
    return new TextDecoder().decode(bytes);
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
  Basic = 'basic',
  Interface = 'interface',
  Struct = 'struct',
  Map = 'map',
  Slice = 'slice',
  Array = 'array',
  Pointer = 'pointer',
  Function = 'function',
  Channel = 'channel',
}

/**
 * TypeInfo is used for runtime type checking.
 * Can be a registered type (from typeRegistry) or an ad-hoc type description.
 * When used as input to typeAssert, it can be a string (type name) or a structured description.
 */

/**
 * Base type information shared by all type kinds
 */
export interface BaseTypeInfo {
  name?: string
  kind: TypeKind
  zeroValue?: any
}

/**
 * Represents an argument or a return value of a method.
 */
export interface MethodArg {
  name?: string // Name of the argument/return value, if available
  type: TypeInfo | string // TypeInfo object or string name of the type
}

/**
 * Represents the signature of a method, including its name, arguments, and return types.
 */
export interface MethodSignature {
  name: string
  args: MethodArg[]
  returns: MethodArg[]
}

/**
 * Type information for struct types
 */
export interface StructTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Struct
  methods: MethodSignature[] // Array of method signatures
  ctor?: new (...args: any[]) => any
  fields: Record<string, TypeInfo | string> // Field names and types for struct fields
}

/**
 * Type information for interface types
 */
export interface InterfaceTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Interface
  methods: MethodSignature[] // Array of method signatures
}

/**
 * Type information for basic types (string, number, boolean)
 */
export interface BasicTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Basic
}

/**
 * Type information for map types
 */
export interface MapTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Map
  keyType?: string | TypeInfo
  elemType?: string | TypeInfo
}

/**
 * Type information for slice types
 */
export interface SliceTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Slice
  elemType?: string | TypeInfo
}

/**
 * Type information for array types
 */
export interface ArrayTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Array
  elemType?: string | TypeInfo
  length: number
}

/**
 * Type information for pointer types
 */
export interface PointerTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Pointer
  elemType?: string | TypeInfo
}

/**
 * Type information for function types
 */
export interface FunctionTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Function
  params?: (string | TypeInfo)[]
  results?: (string | TypeInfo)[]
  isVariadic?: boolean // True if the function is variadic (e.g., ...T)
}

/**
 * Type information for channel types
 */
export interface ChannelTypeInfo extends BaseTypeInfo {
  kind: TypeKind.Channel
  elemType?: string | TypeInfo
  direction?: 'send' | 'receive' | 'both'
}

/**
 * Union type representing all possible TypeInfo variants
 */
export type TypeInfo =
  | StructTypeInfo
  | InterfaceTypeInfo
  | BasicTypeInfo
  | MapTypeInfo
  | SliceTypeInfo
  | ArrayTypeInfo
  | PointerTypeInfo
  | FunctionTypeInfo
  | ChannelTypeInfo

// Type guard functions for TypeInfo variants
export function isStructTypeInfo(info: TypeInfo): info is StructTypeInfo {
  return info.kind === TypeKind.Struct
}

export function isInterfaceTypeInfo(info: TypeInfo): info is InterfaceTypeInfo {
  return info.kind === TypeKind.Interface
}

export function isBasicTypeInfo(info: TypeInfo): info is BasicTypeInfo {
  return info.kind === TypeKind.Basic
}

export function isMapTypeInfo(info: TypeInfo): info is MapTypeInfo {
  return info.kind === TypeKind.Map
}

export function isSliceTypeInfo(info: TypeInfo): info is SliceTypeInfo {
  return info.kind === TypeKind.Slice
}

export function isArrayTypeInfo(info: TypeInfo): info is ArrayTypeInfo {
  return info.kind === TypeKind.Array
}

export function isPointerTypeInfo(info: TypeInfo): info is PointerTypeInfo {
  return info.kind === TypeKind.Pointer
}

export function isFunctionTypeInfo(info: TypeInfo): info is FunctionTypeInfo {
  return info.kind === TypeKind.Function
}

export function isChannelTypeInfo(info: TypeInfo): info is ChannelTypeInfo {
  return info.kind === TypeKind.Channel
}

// Registry to store runtime type information
const typeRegistry = new Map<string, TypeInfo>()

/**
 * Registers a struct type with the runtime type system.
 *
 * @param name The name of the type.
 * @param zeroValue The zero value for the type.
 * @param methods Array of method signatures for the struct.
 * @param ctor Constructor for the struct.
 * @param fields Record of field names and their types.
 * @returns The struct type information object.
 */
export const registerStructType = (
  name: string,
  zeroValue: any,
  methods: MethodSignature[],
  ctor: new (...args: any[]) => any,
  fields: Record<string, TypeInfo | string> = {},
): StructTypeInfo => {
  const typeInfo: StructTypeInfo = {
    name,
    kind: TypeKind.Struct,
    zeroValue,
    methods,
    ctor,
    fields,
  }
  typeRegistry.set(name, typeInfo)
  return typeInfo
}

/**
 * Registers an interface type with the runtime type system.
 *
 * @param name The name of the type.
 * @param zeroValue The zero value for the type (usually null).
 * @param methods Array of method signatures for the interface.
 * @returns The interface type information object.
 */
export const registerInterfaceType = (
  name: string,
  zeroValue: any,
  methods: MethodSignature[],
): InterfaceTypeInfo => {
  const typeInfo: InterfaceTypeInfo = {
    name,
    kind: TypeKind.Interface,
    zeroValue,
    methods,
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
 * Normalizes a type info to a structured TypeInfo object.
 *
 * @param info The type info or name.
 * @returns A normalized TypeInfo object.
 */
function normalizeTypeInfo(info: string | TypeInfo): TypeInfo {
  if (typeof info === 'string') {
    const typeInfo = typeRegistry.get(info)
    if (typeInfo) {
      return typeInfo
    }
    return {
      kind: TypeKind.Basic,
      name: info,
    }
  }

  return info
}

function compareOptionalTypeInfo(
  type1?: string | TypeInfo,
  type2?: string | TypeInfo,
): boolean {
  if (type1 === undefined && type2 === undefined) return true
  if (type1 === undefined || type2 === undefined) return false
  // Assuming areTypeInfosIdentical will handle normalization if needed,
  // but type1 and type2 here are expected to be direct fields from TypeInfo objects.
  return areTypeInfosIdentical(type1, type2)
}

function areFuncParamOrResultArraysIdentical(
  arr1?: (string | TypeInfo)[],
  arr2?: (string | TypeInfo)[],
): boolean {
  if (arr1 === undefined && arr2 === undefined) return true
  if (arr1 === undefined || arr2 === undefined) return false
  if (arr1.length !== arr2.length) return false
  for (let i = 0; i < arr1.length; i++) {
    if (!areTypeInfosIdentical(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
}

function areFuncSignaturesIdentical(
  func1: FunctionTypeInfo,
  func2: FunctionTypeInfo,
): boolean {
  if ((func1.isVariadic || false) !== (func2.isVariadic || false)) {
    return false
  }
  return (
    areFuncParamOrResultArraysIdentical(func1.params, func2.params) &&
    areFuncParamOrResultArraysIdentical(func1.results, func2.results)
  )
}

function areMethodArgsArraysIdentical(
  args1?: MethodArg[],
  args2?: MethodArg[],
): boolean {
  if (args1 === undefined && args2 === undefined) return true
  if (args1 === undefined || args2 === undefined) return false
  if (args1.length !== args2.length) return false
  for (let i = 0; i < args1.length; i++) {
    // Compare based on type only, names of args/results don't affect signature identity here.
    if (!areTypeInfosIdentical(args1[i].type, args2[i].type)) {
      return false
    }
  }
  return true
}

export function areTypeInfosIdentical(
  type1InfoOrName: string | TypeInfo,
  type2InfoOrName: string | TypeInfo,
): boolean {
  const t1Norm = normalizeTypeInfo(type1InfoOrName)
  const t2Norm = normalizeTypeInfo(type2InfoOrName)

  if (t1Norm === t2Norm) return true // Object identity
  if (t1Norm.kind !== t2Norm.kind) return false

  // If types have names, the names must match for identity.
  // If one has a name and the other doesn't, they are not identical.
  if (t1Norm.name !== t2Norm.name) return false

  // If both are named and names match, for Basic, Struct, Interface, this is sufficient for identity.
  if (
    t1Norm.name !== undefined /* && t2Norm.name is also defined and equal */
  ) {
    if (
      t1Norm.kind === TypeKind.Basic ||
      t1Norm.kind === TypeKind.Struct ||
      t1Norm.kind === TypeKind.Interface
    ) {
      return true
    }
  }
  // For other types (Pointer, Slice, etc.), or if both are anonymous (name is undefined),
  // structural comparison is needed.

  switch (t1Norm.kind) {
    case TypeKind.Basic:
      // Names matched if they were defined, or both undefined (which means true by t1Norm.name !== t2Norm.name being false)
      return true
    case TypeKind.Pointer:
      return compareOptionalTypeInfo(
        (t1Norm as PointerTypeInfo).elemType,
        (t2Norm as PointerTypeInfo).elemType,
      )
    case TypeKind.Slice:
      return compareOptionalTypeInfo(
        (t1Norm as SliceTypeInfo).elemType,
        (t2Norm as SliceTypeInfo).elemType,
      )
    case TypeKind.Array:
      return (
        (t1Norm as ArrayTypeInfo).length === (t2Norm as ArrayTypeInfo).length &&
        compareOptionalTypeInfo(
          (t1Norm as ArrayTypeInfo).elemType,
          (t2Norm as ArrayTypeInfo).elemType,
        )
      )
    case TypeKind.Map:
      return (
        compareOptionalTypeInfo(
          (t1Norm as MapTypeInfo).keyType,
          (t2Norm as MapTypeInfo).keyType,
        ) &&
        compareOptionalTypeInfo(
          (t1Norm as MapTypeInfo).elemType,
          (t2Norm as MapTypeInfo).elemType,
        )
      )
    case TypeKind.Channel:
      return (
        // Ensure direction property exists before comparing, or handle undefined if it can be
        ((t1Norm as ChannelTypeInfo).direction || 'both') ===
          ((t2Norm as ChannelTypeInfo).direction || 'both') &&
        compareOptionalTypeInfo(
          (t1Norm as ChannelTypeInfo).elemType,
          (t2Norm as ChannelTypeInfo).elemType,
        )
      )
    case TypeKind.Function:
      return areFuncSignaturesIdentical(
        t1Norm as FunctionTypeInfo,
        t2Norm as FunctionTypeInfo,
      )
    case TypeKind.Struct:
    case TypeKind.Interface:
      // If we reach here, names were undefined (both anonymous) or names matched but was not Basic/Struct/Interface.
      // For anonymous Struct/Interface, strict identity means full structural comparison.
      // For now, we consider anonymous types not identical unless they are the same object (caught above).
      // If they were named and matched, 'return true' was hit earlier for these kinds.
      return false
    default:
      return false
  }
}

/**
 * Validates that a map key matches the expected type info.
 *
 * @param key The key to validate
 * @param keyTypeInfo The normalized type info for the key
 * @returns True if the key matches the type info, false otherwise
 */
function validateMapKey(key: any, keyTypeInfo: TypeInfo): boolean {
  if (keyTypeInfo.kind === TypeKind.Basic) {
    // For string keys
    if (keyTypeInfo.name === 'string') {
      return typeof key === 'string'
    } else if (
      keyTypeInfo.name === 'int' ||
      keyTypeInfo.name === 'float64' ||
      keyTypeInfo.name === 'number'
    ) {
      if (typeof key === 'string') {
        return /^-?\d+(\.\d+)?$/.test(key)
      } else {
        return typeof key === 'number'
      }
    }
  }
  return false
}

/**
 * Checks if a value matches a basic type info.
 *
 * @param value The value to check.
 * @param info The basic type info to match against.
 * @returns True if the value matches the basic type, false otherwise.
 */
function matchesBasicType(value: any, info: TypeInfo): boolean {
  if (info.name === 'string') return typeof value === 'string'
  if (info.name === 'number' || info.name === 'int' || info.name === 'float64')
    return typeof value === 'number'
  if (info.name === 'boolean' || info.name === 'bool')
    return typeof value === 'boolean'
  return false
}

/**
 * Checks if a value matches a struct type info.
 *
 * @param value The value to check.
 * @param info The struct type info to match against.
 * @returns True if the value matches the struct type, false otherwise.
 */
function matchesStructType(value: any, info: TypeInfo): boolean {
  if (!isStructTypeInfo(info)) return false

  // For structs, use instanceof with the constructor
  if (info.ctor && value instanceof info.ctor) {
    return true
  }

  // Check if the value has all methods defined in the struct's TypeInfo
  // This is a structural check, not a signature check here.
  // Signature checks are more relevant for interface satisfaction.
  if (info.methods && typeof value === 'object' && value !== null) {
    const allMethodsExist = info.methods.every(
      (methodSig) => typeof (value as any)[methodSig.name] === 'function',
    )
    if (!allMethodsExist) {
      return false
    }
    // Further signature checking could be added here if needed for struct-to-struct assignability
  }

  if (typeof value === 'object' && value !== null && info.fields) {
    const fieldNames = Object.keys(info.fields || {})
    const valueFields = Object.keys(value)

    const fieldsExist = fieldNames.every((field) => field in value)
    const sameFieldCount = valueFields.length === fieldNames.length
    const allFieldsInStruct = valueFields.every((field) =>
      fieldNames.includes(field),
    )

    if (fieldsExist && sameFieldCount && allFieldsInStruct) {
      return Object.entries(info.fields).every(([fieldName, fieldType]) => {
        return matchesType(
          value[fieldName],
          normalizeTypeInfo(fieldType as TypeInfo | string),
        )
      })
    }

    return false
  }

  return false
}

/**
 * Checks if a value matches an interface type info.
 *
 * @param value The value to check.
 * @param info The interface type info to match against.
 * @returns True if the value matches the interface type, false otherwise.
 */
/**
 * Checks if a value matches an interface type info by verifying it implements
 * all required methods with compatible signatures.
 *
 * @param value The value to check.
 * @param info The interface type info to match against.
 * @returns True if the value matches the interface type, false otherwise.
 */
function matchesInterfaceType(value: any, info: TypeInfo): boolean {
  // Check basic conditions first
  if (
    !isInterfaceTypeInfo(info) ||
    typeof value !== 'object' ||
    value === null
  ) {
    return false
  }

  // For interfaces, check if the value has all the required methods with compatible signatures
  return info.methods.every((requiredMethodSig) => {
    const actualMethod = (value as any)[requiredMethodSig.name]

    // Method must exist and be a function
    if (typeof actualMethod !== 'function') {
      return false
    }

    // Check parameter count (basic arity check)
    // Note: This is a simplified check as JavaScript functions can have optional/rest parameters
    const declaredParamCount = actualMethod.length
    const requiredParamCount = requiredMethodSig.args.length

    // Strict arity checking can be problematic in JS, so we'll be lenient
    // A method with fewer params than required is definitely incompatible
    if (declaredParamCount < requiredParamCount) {
      return false
    }

    // Check return types if we can determine them
    // This is challenging in JavaScript without runtime type information

    // If the value has a __goTypeName property, it might be a registered type
    // with more type information available
    if (value.__goTypeName) {
      const valueTypeInfo = typeRegistry.get(value.__goTypeName)
      if (valueTypeInfo && isStructTypeInfo(valueTypeInfo)) {
        // Find the matching method in the value's type info
        const valueMethodSig = valueTypeInfo.methods.find(
          (m) => m.name === requiredMethodSig.name,
        )

        if (valueMethodSig) {
          // Compare return types
          if (
            valueMethodSig.returns.length !== requiredMethodSig.returns.length
          ) {
            return false
          }

          // Compare each return type for compatibility
          for (let i = 0; i < requiredMethodSig.returns.length; i++) {
            const requiredReturnType = normalizeTypeInfo(
              requiredMethodSig.returns[i].type,
            )
            const valueReturnType = normalizeTypeInfo(
              valueMethodSig.returns[i].type,
            )

            // For interface return types, we need to check if the value's return type
            // implements the required interface
            if (isInterfaceTypeInfo(requiredReturnType)) {
              // This would be a recursive check, but we'll simplify for now
              // by just checking if the types are the same or if the value type
              // is registered as implementing the interface
              if (requiredReturnType.name !== valueReturnType.name) {
                // Check if valueReturnType implements requiredReturnType
                // This would require additional implementation tracking
                return false
              }
            }
            // For non-interface types, check direct type compatibility
            else if (requiredReturnType.name !== valueReturnType.name) {
              return false
            }
          }

          // Similarly, we could check parameter types for compatibility
          // but we'll skip that for brevity
        }
      }
    }

    // If we can't determine detailed type information, we'll accept the method
    // as long as it exists with a compatible arity
    return true
  })
}

/**
 * Checks if a value matches a map type info.
 *
 * @param value The value to check.
 * @param info The map type info to match against.
 * @returns True if the value matches the map type, false otherwise.
 */
function matchesMapType(value: any, info: TypeInfo): boolean {
  if (typeof value !== 'object' || value === null) return false
  if (!isMapTypeInfo(info)) return false

  if (info.keyType || info.elemType) {
    let entries: [any, any][] = []

    if (value instanceof Map) {
      entries = Array.from(value.entries())
    } else {
      entries = Object.entries(value)
    }

    if (entries.length === 0) return true // Empty map matches any map type

    const sampleSize = Math.min(5, entries.length)
    for (let i = 0; i < sampleSize; i++) {
      const [k, v] = entries[i]

      if (info.keyType) {
        if (
          !validateMapKey(
            k,
            normalizeTypeInfo(info.keyType as string | TypeInfo),
          )
        ) {
          return false
        }
      }

      if (
        info.elemType &&
        !matchesType(v, normalizeTypeInfo(info.elemType as string | TypeInfo))
      ) {
        return false
      }
    }
  }

  return true
}

/**
 * Checks if a value matches an array or slice type info.
 *
 * @param value The value to check.
 * @param info The array or slice type info to match against.
 * @returns True if the value matches the array or slice type, false otherwise.
 */
function matchesArrayOrSliceType(value: any, info: TypeInfo): boolean {
  // For slices and arrays, check if the value is an array and sample element types
  if (!Array.isArray(value)) return false
  if (!isArrayTypeInfo(info) && !isSliceTypeInfo(info)) return false

  if (info.elemType) {
    const arr = value as any[]
    if (arr.length === 0) return true // Empty array matches any array type

    const sampleSize = Math.min(5, arr.length)
    for (let i = 0; i < sampleSize; i++) {
      if (
        !matchesType(
          arr[i],
          normalizeTypeInfo(info.elemType as string | TypeInfo),
        )
      ) {
        return false
      }
    }
  }

  return true
}

/**
 * Checks if a value matches a pointer type info.
 *
 * @param value The value to check.
 * @param info The pointer type info to match against.
 * @returns True if the value matches the pointer type, false otherwise.
 */
function matchesPointerType(value: any, info: TypeInfo): boolean {
  // Allow null/undefined values to match pointer types to support nil pointer assertions
  // This enables Go's nil pointer type assertions like `ptr, ok := i.(*SomeType)` to work correctly
  if (value === null || value === undefined) {
    return true
  }

  // Check if the value is a Box (has a 'value' property)
  if (typeof value !== 'object' || !('value' in value)) {
    return false
  }

  if (!isPointerTypeInfo(info)) return false

  if (info.elemType) {
    const elemTypeInfo = normalizeTypeInfo(info.elemType as string | TypeInfo)
    return matchesType(value.value, elemTypeInfo)
  }

  return true
}

/**
 * Checks if a value matches a function type info.
 *
 * @param value The value to check.
 * @param info The function type info to match against.
 * @returns True if the value matches the function type, false otherwise.
 */
function matchesFunctionType(value: any, info: FunctionTypeInfo): boolean {
  // First check if the value is a function
  if (typeof value !== 'function') {
    return false
  }

  // This is important for named function types
  if (info.name && value.__goTypeName) {
    return info.name === value.__goTypeName
  }

  return true
}

/**
 * Checks if a value matches a channel type info.
 *
 * @param value The value to check.
 * @param info The channel type info to match against.
 * @returns True if the value matches the channel type, false otherwise.
 */
function matchesChannelType(value: any, info: ChannelTypeInfo): boolean {
  // First check if it's a channel or channel reference
  if (typeof value !== 'object' || value === null) {
    return false
  }

  // If it's a ChannelRef, get the underlying channel
  let channel = value
  let valueDirection = 'both'

  if ('channel' in value && 'direction' in value) {
    channel = value.channel
    valueDirection = value.direction
  }

  // Check if it has channel methods
  if (
    !('send' in channel) ||
    !('receive' in channel) ||
    !('close' in channel) ||
    typeof channel.send !== 'function' ||
    typeof channel.receive !== 'function' ||
    typeof channel.close !== 'function'
  ) {
    return false
  }

  if (info.elemType) {
    if (
      info.elemType === 'string' &&
      'zeroValue' in channel &&
      channel.zeroValue !== ''
    ) {
      return false
    }

    if (
      info.elemType === 'number' &&
      'zeroValue' in channel &&
      typeof channel.zeroValue !== 'number'
    ) {
      return false
    }
  }

  if (info.direction) {
    return valueDirection === info.direction
  }

  return true
}

/**
 * Checks if a value matches a type info.
 *
 * @param value The value to check.
 * @param info The type info to match against.
 * @returns True if the value matches the type info, false otherwise.
 */
function matchesType(value: any, info: TypeInfo): boolean {
  if (value === null || value === undefined) {
    return false
  }

  switch (info.kind) {
    case TypeKind.Basic:
      return matchesBasicType(value, info)

    case TypeKind.Struct:
      return matchesStructType(value, info)

    case TypeKind.Interface:
      return matchesInterfaceType(value, info)

    case TypeKind.Map:
      return matchesMapType(value, info)

    case TypeKind.Slice:
    case TypeKind.Array:
      return matchesArrayOrSliceType(value, info)

    case TypeKind.Pointer:
      return matchesPointerType(value, info)

    case TypeKind.Function:
      return matchesFunctionType(value, info as FunctionTypeInfo)

    case TypeKind.Channel:
      return matchesChannelType(value, info)

    default:
      console.warn(
        `Type matching for kind '${(info as TypeInfo).kind}' not implemented.`,
      )
      return false
  }
}
/**
 * Performs a type assertion on a value against a specified type.
 * Returns an object containing the value (cast to type T) and a boolean indicating success.
 * This is used to implement Go's type assertion with comma-ok idiom: value, ok := x.(Type)
 *
 * @param value The value to check against the type
 * @param typeInfo The type information to check against (can be a string name or TypeInfo object)
 * @returns An object with the asserted value and a boolean indicating if the assertion succeeded
 */
export function typeAssert<T>(
  value: any,
  typeInfo: string | TypeInfo,
): TypeAssertResult<T> {
  const normalizedType = normalizeTypeInfo(typeInfo)

  if (isPointerTypeInfo(normalizedType) && value === null) {
    return { value: null as unknown as T, ok: true }
  }

  if (
    isStructTypeInfo(normalizedType) &&
    normalizedType.methods &&
    normalizedType.methods.length > 0 &&
    typeof value === 'object' &&
    value !== null
  ) {
    // Check if the value implements all methods of the struct type with compatible signatures.
    // This is more for interface satisfaction by a struct.
    // For struct-to-struct assertion, usually instanceof or field checks are primary.
    const allMethodsMatch = normalizedType.methods.every(
      (requiredMethodSig) => {
        const actualMethod = (value as any)[requiredMethodSig.name]
        if (typeof actualMethod !== 'function') {
          return false
        }
        const valueTypeInfoVal = (value as any).$typeInfo
        if (valueTypeInfoVal) {
          const normalizedValueType = normalizeTypeInfo(valueTypeInfoVal)
          if (
            isStructTypeInfo(normalizedValueType) ||
            isInterfaceTypeInfo(normalizedValueType)
          ) {
            const actualValueMethodSig = normalizedValueType.methods.find(
              (m) => m.name === requiredMethodSig.name,
            )
            if (actualValueMethodSig) {
              // Perform full signature comparison using MethodSignatures
              const paramsMatch = areMethodArgsArraysIdentical(
                requiredMethodSig.args,
                actualValueMethodSig.args,
              )
              const resultsMatch = areMethodArgsArraysIdentical(
                requiredMethodSig.returns,
                actualValueMethodSig.returns,
              )
              return paramsMatch && resultsMatch
            } else {
              // Value has TypeInfo listing methods, but this specific method isn't listed.
              // This implies a mismatch for strict signature check based on TypeInfo.
              return false
            }
          }
        }

        // Fallback: Original behavior if value has no TypeInfo that lists methods,
        // or if the method wasn't found in its TypeInfo (covered by 'else' returning false above).
        // The original comment was: "For now, presence and function type is checked by matchesStructType/matchesInterfaceType"
        // This 'return true' implies that if we couldn't do a full signature check via TypeInfo,
        // we still consider it a match if the function simply exists on the object.
        return true
      },
    )

    if (allMethodsMatch) {
      return { value: value as T, ok: true }
    }
  }

  if (
    isStructTypeInfo(normalizedType) &&
    normalizedType.fields &&
    typeof value === 'object' &&
    value !== null
  ) {
    const fieldNames = Object.keys(normalizedType.fields)
    const valueFields = Object.keys(value)

    // For struct type assertions, we need exact field matching
    const structFieldsMatch =
      fieldNames.length === valueFields.length &&
      fieldNames.every((field: string) => field in value) &&
      valueFields.every((field) => fieldNames.includes(field))

    if (structFieldsMatch) {
      const typesMatch = Object.entries(normalizedType.fields).every(
        ([fieldName, fieldType]) => {
          return matchesType(
            value[fieldName],
            normalizeTypeInfo(fieldType as TypeInfo | string),
          )
        },
      )

      return { value: value as T, ok: typesMatch }
    } else {
      return { value: null as unknown as T, ok: false }
    }
  }

  if (
    isMapTypeInfo(normalizedType) &&
    typeof value === 'object' &&
    value !== null
  ) {
    if (normalizedType.keyType || normalizedType.elemType) {
      let entries: [any, any][] = []

      if (value instanceof Map) {
        entries = Array.from(value.entries())
      } else {
        entries = Object.entries(value)
      }

      if (entries.length === 0) {
        return { value: value as T, ok: true }
      }

      const sampleSize = Math.min(5, entries.length)
      for (let i = 0; i < sampleSize; i++) {
        const [k, v] = entries[i]

        if (normalizedType.keyType) {
          if (
            !validateMapKey(
              k,
              normalizeTypeInfo(normalizedType.keyType as string | TypeInfo),
            )
          ) {
            return { value: null as unknown as T, ok: false }
          }
        }

        if (normalizedType.elemType) {
          const elemTypeInfo = normalizeTypeInfo(
            normalizedType.elemType as string | TypeInfo,
          )
          if (!matchesType(v, elemTypeInfo)) {
            return { value: null as unknown as T, ok: false }
          }
        }
      }

      // If we get here, the map type assertion passes
      return { value: value as T, ok: true }
    }
  }

  const matches = matchesType(value, normalizedType)

  if (matches) {
    return { value: value as T, ok: true }
  }

  // If we get here, the assertion failed
  // For registered types, use the zero value from the registry
  if (typeof typeInfo === 'string') {
    const registeredType = typeRegistry.get(typeInfo)
    if (registeredType && registeredType.zeroValue !== undefined) {
      return { value: registeredType.zeroValue as T, ok: false }
    }
  } else if (normalizedType.zeroValue !== undefined) {
    return { value: normalizedType.zeroValue as T, ok: false }
  }

  return { value: null as unknown as T, ok: false }
}

/**
 * Performs a type assertion on a value against a specified type.
 * Returns the value (cast to type T) if the assertion is successful,
 * otherwise throws a runtime error.
 * This is used to implement Go's single-value type assertion: value := x.(Type)
 *
 * @param value The value to check against the type
 * @param typeInfo The type information to check against (can be a string name or TypeInfo object)
 * @returns The asserted value if the assertion succeeded
 * @throws Error if the type assertion fails
 */
export function mustTypeAssert<T>(value: any, typeInfo: string | TypeInfo): T {
  const { value: assertedValue, ok } = typeAssert<T>(value, typeInfo)
  if (!ok) {
    const targetTypeName =
      typeof typeInfo === 'string' ? typeInfo : (
        typeInfo.name || JSON.stringify(typeInfo)
      )
    let valueTypeName: string | 'nil' = typeof value
    if (value && value.constructor && value.constructor.name) {
      valueTypeName = value.constructor.name
    }
    if (value === null) {
      valueTypeName = 'nil'
    }
    throw new Error(
      `inline type conversion panic: value is ${valueTypeName}, not ${targetTypeName}`,
    )
  }
  return assertedValue
}

/**
 * Checks if a value is of a specific type.
 * Similar to typeAssert but only returns a boolean without extracting the value.
 *
 * @param value The value to check
 * @param typeInfo The type information to check against
 * @returns True if the value matches the type, false otherwise
 */
export function is(value: any, typeInfo: string | TypeInfo): boolean {
  return matchesType(value, normalizeTypeInfo(typeInfo))
}

/**
 * Represents a case in a type switch statement.
 * Each case matches against one or more types and contains a body function to execute when matched.
 */
export interface TypeSwitchCase {
  types: (string | TypeInfo)[] // Array of types for this case (e.g., case int, string:)
  body: (value?: any) => void // Function representing the case body. 'value' is the asserted value if applicable.
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

/**
 * Helper for Go's type switch statement.
 * Executes the body of the first case whose type matches the value.
 *
 * @param value The value being switched upon.
 * @param cases An array of TypeSwitchCase objects.
 * @param defaultCase Optional function for the default case.
 */
export function typeSwitch(
  value: any,
  cases: TypeSwitchCase[],
  defaultCase?: () => void,
): void {
  for (const caseObj of cases) {
    // For cases with multiple types (case T1, T2:), use $.is
    if (caseObj.types.length > 1) {
      const matchesAny = caseObj.types.some((typeInfo) => is(value, typeInfo))
      if (matchesAny) {
        // For multi-type cases, the case variable (if any) gets the original value
        caseObj.body(value)
        return // Found a match, exit switch
      }
    } else if (caseObj.types.length === 1) {
      // For single-type cases (case T:), use $.typeAssert to get the typed value and ok status
      const typeInfo = caseObj.types[0]
      const { value: assertedValue, ok } = typeAssert(value, typeInfo)
      if (ok) {
        // Pass the asserted value to the case body function
        caseObj.body(assertedValue)

        return // Found a match, exit switch
      }
    }
    // Note: Cases with 0 types are not valid in Go type switches
  }

  // If no case matched and a default case exists, execute it
  if (defaultCase) {
    defaultCase()
  }
}

// A simple implementation of buffered channels
class BufferedChannel<T> implements Channel<T> {
  private buffer: T[] = []
  private closed: boolean = false
  private capacity: number
  public zeroValue: T // Made public for access by ChannelRef or for type inference

  // Senders queue: stores { value, resolve for send, reject for send }
  private senders: Array<{
    value: T
    resolveSend: () => void
    rejectSend: (e: Error) => void
  }> = []

  // Receivers queue for receive(): stores { resolve for receive, reject for receive }
  private receivers: Array<{
    resolveReceive: (value: T) => void
    rejectReceive: (e: Error) => void
  }> = []

  // Receivers queue for receiveWithOk(): stores { resolve for receiveWithOk }
  private receiversWithOk: Array<{
    resolveReceive: (result: ChannelReceiveResult<T>) => void
  }> = []

  constructor(capacity: number, zeroValue: T) {
    if (capacity < 0) {
      throw new Error('Channel capacity cannot be negative')
    }
    this.capacity = capacity
    this.zeroValue = zeroValue
  }

  async send(value: T): Promise<void> {
    if (this.closed) {
      throw new Error('send on closed channel')
    }

    // Attempt to hand off to a waiting receiver (rendezvous)
    if (this.receivers.length > 0) {
      const receiverTask = this.receivers.shift()!
      queueMicrotask(() => receiverTask.resolveReceive(value))
      return
    }
    if (this.receiversWithOk.length > 0) {
      const receiverTask = this.receiversWithOk.shift()!
      queueMicrotask(() => receiverTask.resolveReceive({ value, ok: true }))
      return
    }

    // If no waiting receivers, try to buffer if space is available
    if (this.buffer.length < this.capacity) {
      this.buffer.push(value)
      return
    }

    // Buffer is full (or capacity is 0 and no receivers are waiting). Sender must block.
    return new Promise<void>((resolve, reject) => {
      this.senders.push({ value, resolveSend: resolve, rejectSend: reject })
    })
  }

  async receive(): Promise<T> {
    // Attempt to get from buffer first
    if (this.buffer.length > 0) {
      const value = this.buffer.shift()!
      // If a sender was waiting because the buffer was full, unblock it.
      if (this.senders.length > 0) {
        const senderTask = this.senders.shift()!
        this.buffer.push(senderTask.value) // Sender's value now goes into buffer
        queueMicrotask(() => senderTask.resolveSend()) // Unblock sender
      }
      return value
    }

    // Buffer is empty.
    // If channel is closed (and buffer is empty), subsequent receives panic.
    if (this.closed) {
      throw new Error('receive on closed channel')
    }

    // Buffer is empty, channel is open.
    // Attempt to rendezvous with a waiting sender.
    if (this.senders.length > 0) {
      const senderTask = this.senders.shift()!
      queueMicrotask(() => senderTask.resolveSend()) // Unblock the sender
      return senderTask.value // Return the value from sender
    }

    // Buffer is empty, channel is open, no waiting senders. Receiver must block.
    return new Promise<T>((resolve, reject) => {
      this.receivers.push({ resolveReceive: resolve, rejectReceive: reject })
    })
  }

  async receiveWithOk(): Promise<ChannelReceiveResult<T>> {
    // Attempt to get from buffer first
    if (this.buffer.length > 0) {
      const value = this.buffer.shift()!
      if (this.senders.length > 0) {
        const senderTask = this.senders.shift()!
        this.buffer.push(senderTask.value)
        queueMicrotask(() => senderTask.resolveSend())
      }
      return { value, ok: true }
    }

    // Buffer is empty.
    // Attempt to rendezvous with a waiting sender.
    if (this.senders.length > 0) {
      const senderTask = this.senders.shift()!
      queueMicrotask(() => senderTask.resolveSend())
      return { value: senderTask.value, ok: true }
    }

    // Buffer is empty, no waiting senders.
    // If channel is closed, return zero value with ok: false.
    if (this.closed) {
      return { value: this.zeroValue, ok: false }
    }

    // Buffer is empty, channel is open, no waiting senders. Receiver must block.
    return new Promise<ChannelReceiveResult<T>>((resolve) => {
      this.receiversWithOk.push({ resolveReceive: resolve })
    })
  }

  async selectReceive(id: number): Promise<SelectResult<T>> {
    if (this.buffer.length > 0) {
      const value = this.buffer.shift()!
      if (this.senders.length > 0) {
        const senderTask = this.senders.shift()!
        this.buffer.push(senderTask.value)
        queueMicrotask(() => senderTask.resolveSend())
      }
      return { value, ok: true, id }
    }

    if (this.senders.length > 0) {
      const senderTask = this.senders.shift()!
      queueMicrotask(() => senderTask.resolveSend())
      return { value: senderTask.value, ok: true, id }
    }

    if (this.closed) {
      return { value: this.zeroValue, ok: false, id }
    }

    return new Promise<SelectResult<T>>((resolve) => {
      this.receiversWithOk.push({
        resolveReceive: (result: ChannelReceiveResult<T>) => {
          resolve({ ...result, id })
        },
      })
    })
  }

  async selectSend(value: T, id: number): Promise<SelectResult<boolean>> {
    if (this.closed) {
      // A select case sending on a closed channel panics in Go.
      // This will cause Promise.race in selectStatement to reject.
      throw new Error('send on closed channel')
    }

    if (this.receivers.length > 0) {
      const receiverTask = this.receivers.shift()!
      queueMicrotask(() => receiverTask.resolveReceive(value))
      return { value: true, ok: true, id }
    }
    if (this.receiversWithOk.length > 0) {
      const receiverTask = this.receiversWithOk.shift()!
      queueMicrotask(() => receiverTask.resolveReceive({ value, ok: true }))
      return { value: true, ok: true, id }
    }

    if (this.buffer.length < this.capacity) {
      this.buffer.push(value)
      return { value: true, ok: true, id }
    }

    return new Promise<SelectResult<boolean>>((resolve, reject) => {
      this.senders.push({
        value,
        resolveSend: () => resolve({ value: true, ok: true, id }),
        rejectSend: (e) => reject(e), // Propagate error if channel closes
      })
    })
  }

  close(): void {
    if (this.closed) {
      throw new Error('close of closed channel')
    }
    this.closed = true

    const sendersToNotify = [...this.senders] // Shallow copy for iteration
    this.senders = []
    for (const senderTask of sendersToNotify) {
      queueMicrotask(() =>
        senderTask.rejectSend(new Error('send on closed channel')),
      )
    }

    const receiversToNotify = [...this.receivers]
    this.receivers = []
    for (const receiverTask of receiversToNotify) {
      queueMicrotask(() =>
        receiverTask.rejectReceive(new Error('receive on closed channel')),
      )
    }

    const receiversWithOkToNotify = [...this.receiversWithOk]
    this.receiversWithOk = []
    for (const receiverTask of receiversWithOkToNotify) {
      queueMicrotask(() =>
        receiverTask.resolveReceive({ value: this.zeroValue, ok: false }),
      )
    }
  }

  canReceiveNonBlocking(): boolean {
    return this.buffer.length > 0 || this.senders.length > 0 || this.closed
  }

  canSendNonBlocking(): boolean {
    if (this.closed) {
      return true // Ready to panic
    }
    return (
      this.buffer.length < this.capacity ||
      this.receivers.length > 0 ||
      this.receiversWithOk.length > 0
    )
  }
}

/**
 * Represents a reference to a channel with a specific direction.
 */
export interface ChannelRef<T> {
  /**
   * The underlying channel
   */
  channel: Channel<T>

  /**
   * The direction of this channel reference
   */
  direction: 'send' | 'receive' | 'both'

  // Channel methods
  send(value: T): Promise<void>
  receive(): Promise<T>
  receiveWithOk(): Promise<ChannelReceiveResult<T>>
  close(): void
  canSendNonBlocking(): boolean
  canReceiveNonBlocking(): boolean
  selectSend(value: T, id: number): Promise<SelectResult<boolean>>
  selectReceive(id: number): Promise<SelectResult<T>>
}

/**
 * A bidirectional channel reference.
 */
export class BidirectionalChannelRef<T> implements ChannelRef<T> {
  direction: 'both' = 'both'

  constructor(public channel: Channel<T>) {}

  // Delegate all methods to the underlying channel
  send(value: T): Promise<void> {
    return this.channel.send(value)
  }

  receive(): Promise<T> {
    return this.channel.receive()
  }

  receiveWithOk(): Promise<ChannelReceiveResult<T>> {
    return this.channel.receiveWithOk()
  }

  close(): void {
    this.channel.close()
  }

  canSendNonBlocking(): boolean {
    return this.channel.canSendNonBlocking()
  }

  canReceiveNonBlocking(): boolean {
    return this.channel.canReceiveNonBlocking()
  }

  selectSend(value: T, id: number): Promise<SelectResult<boolean>> {
    return this.channel.selectSend(value, id)
  }

  selectReceive(id: number): Promise<SelectResult<T>> {
    return this.channel.selectReceive(id)
  }
}

/**
 * A send-only channel reference.
 */
export class SendOnlyChannelRef<T> implements ChannelRef<T> {
  direction: 'send' = 'send'

  constructor(public channel: Channel<T>) {}

  // Allow send operations
  send(value: T): Promise<void> {
    return this.channel.send(value)
  }

  // Allow close operations
  close(): void {
    this.channel.close()
  }

  canSendNonBlocking(): boolean {
    return this.channel.canSendNonBlocking()
  }

  selectSend(value: T, id: number): Promise<SelectResult<boolean>> {
    return this.channel.selectSend(value, id)
  }

  // Disallow receive operations
  receive(): Promise<T> {
    throw new Error('Cannot receive from send-only channel')
  }

  receiveWithOk(): Promise<ChannelReceiveResult<T>> {
    throw new Error('Cannot receive from send-only channel')
  }

  canReceiveNonBlocking(): boolean {
    return false
  }

  selectReceive(id: number): Promise<SelectResult<T>> {
    throw new Error('Cannot receive from send-only channel')
  }
}

/**
 * A receive-only channel reference.
 */
export class ReceiveOnlyChannelRef<T> implements ChannelRef<T> {
  direction: 'receive' = 'receive'

  constructor(public channel: Channel<T>) {}

  // Allow receive operations
  receive(): Promise<T> {
    return this.channel.receive()
  }

  receiveWithOk(): Promise<ChannelReceiveResult<T>> {
    return this.channel.receiveWithOk()
  }

  canReceiveNonBlocking(): boolean {
    return this.channel.canReceiveNonBlocking()
  }

  selectReceive(id: number): Promise<SelectResult<T>> {
    return this.channel.selectReceive(id)
  }

  // Disallow send operations
  send(value: T): Promise<void> {
    throw new Error('Cannot send to receive-only channel')
  }

  // Disallow close operations
  close(): void {
    throw new Error('Cannot close receive-only channel')
  }

  canSendNonBlocking(): boolean {
    return false
  }

  selectSend(value: T, id: number): Promise<SelectResult<boolean>> {
    throw new Error('Cannot send to receive-only channel')
  }
}

/**
 * Creates a new channel reference with the specified direction.
 */
export function makeChannelRef<T>(
  channel: Channel<T>,
  direction: 'send' | 'receive' | 'both',
): ChannelRef<T> {
  switch (direction) {
    case 'send':
      return new SendOnlyChannelRef<T>(channel)
    case 'receive':
      return new ReceiveOnlyChannelRef<T>(channel)
    default: // 'both'
      return new BidirectionalChannelRef<T>(channel)
  }
}

/**
 * Represents a case in a select statement.
 */
export interface SelectCase<T> {
  id: number
  isSend: boolean // true for send, false for receive
  channel: Channel<any> | ChannelRef<any> | null // Allow null and ChannelRef
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
    // Skip nil channels - they are never ready in Go
    if (caseObj.channel === null) {
      continue
    }
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
    .filter((c) => c.id !== -1) // Exclude default case
    .filter((c) => c.channel !== null) // Exclude nil channels (they would block forever)
    .map((caseObj) => {
      // At this point caseObj.channel is guaranteed to be non-null
      if (caseObj.isSend) {
        return caseObj.channel!.selectSend(caseObj.value, caseObj.id)
      } else {
        return caseObj.channel!.selectReceive(caseObj.id)
      }
    })

  // If all non-default cases have nil channels, we effectively block forever
  if (blockingPromises.length === 0) {
    // No valid channels to operate on, block forever (unless there's a default)
    return new Promise<void>(() => {}) // Promise never resolves
  }

  const result = await Promise.race(blockingPromises)
  // Execute onSelected handler for the selected case
  const selectedCase = cases.find((c) => c.id === result.id)
  if (selectedCase && selectedCase.onSelected) {
    await selectedCase.onSelected(result) // Await the handler
  }
  // No explicit return needed here, as the function will implicitly return after the await
}

/**
 * Helper function for channel send operations that handles nil channels correctly.
 * In Go, sending to a nil channel blocks forever.
 * @param channel The channel to send to (can be null)
 * @param value The value to send
 * @returns Promise that never resolves if channel is null, otherwise delegates to channel.send()
 */
export async function chanSend<T>(
  channel: Channel<T> | ChannelRef<T> | null,
  value: T,
): Promise<void> {
  if (channel === null) {
    // In Go, sending to a nil channel blocks forever
    return new Promise<void>(() => {}) // Promise that never resolves
  }
  return channel.send(value)
}

/**
 * Helper function for channel receive operations that handles nil channels correctly.
 * In Go, receiving from a nil channel blocks forever.
 * @param channel The channel to receive from (can be null)
 * @returns Promise that never resolves if channel is null, otherwise delegates to channel.receive()
 */
export async function chanRecv<T>(
  channel: Channel<T> | ChannelRef<T> | null,
): Promise<T> {
  if (channel === null) {
    // In Go, receiving from a nil channel blocks forever
    return new Promise<T>(() => {}) // Promise that never resolves
  }
  return channel.receive()
}

/**
 * Helper function for channel receive operations with ok value that handles nil channels correctly.
 * In Go, receiving from a nil channel blocks forever.
 * @param channel The channel to receive from (can be null)
 * @returns Promise that never resolves if channel is null, otherwise delegates to channel.receiveWithOk()
 */
export async function chanRecvWithOk<T>(
  channel: Channel<T> | ChannelRef<T> | null,
): Promise<ChannelReceiveResult<T>> {
  if (channel === null) {
    // In Go, receiving from a nil channel blocks forever
    return new Promise<ChannelReceiveResult<T>>(() => {}) // Promise that never resolves
  }
  return channel.receiveWithOk()
}

/**
 * Creates a new channel with the specified buffer size and zero value.
 * @param bufferSize The size of the channel buffer. If 0, creates an unbuffered channel.
 * @param zeroValue The zero value for the channel's element type.
 * @param direction Optional direction for the channel. Default is 'both' (bidirectional).
 * @returns A new channel instance or channel reference.
 */
export const makeChannel = <T>(
  bufferSize: number,
  zeroValue: T,
  direction: 'send' | 'receive' | 'both' = 'both',
): Channel<T> | ChannelRef<T> => {
  const channel = new BufferedChannel<T>(bufferSize, zeroValue)

  // Wrap the channel with the appropriate ChannelRef based on direction
  if (direction === 'send') {
    return new SendOnlyChannelRef<T>(channel) as ChannelRef<T>
  } else if (direction === 'receive') {
    return new ReceiveOnlyChannelRef<T>(channel) as ChannelRef<T>
  } else {
    return channel
  }
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
