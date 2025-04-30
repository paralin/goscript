/**
 * Creates a new slice (TypeScript array) with the specified length and capacity.
 * @param len The length of the slice.
 * @param cap The capacity of the slice (optional).
 * @returns A new TypeScript array representing the slice.
 */
export const makeSlice = <T>(
  len: number,
  cap?: number,
): Array<T> & { __capacity?: number } => {
  const slice = new Array<T>(len) as Array<T> & { __capacity?: number }
  slice.__capacity = cap !== undefined ? cap : len
  return slice
}

/**
 * Creates a new slice header that shares the backing array.
 * Arguments mirror Go semantics; omitted indices are undefined.
 *
 * @param arr  The original slice/array produced by makeSlice or another slice
 * @param low  Starting index (defaults to 0)
 * @param high Ending index (defaults to arr.length)
 * @param max  Capacity limit (defaults to original capacity)
 */
export const slice = <T>(
  arr: Array<T> & { __capacity?: number },
  low?: number,
  high?: number,
  max?: number,
): Array<T> & { __capacity?: number } => {
  const start = low ?? 0
  const origLen = arr.length
  const origCap = arr.__capacity !== undefined ? arr.__capacity : origLen
  const end = high !== undefined ? high : origLen
  const newCap = max !== undefined ? max - start : origCap - start

  const newArr = arr.slice(start, end) as Array<T> & {
    __capacity?: number
  }
  newArr.__capacity = newCap
  return newArr
}

/**
 * Creates a new map (TypeScript Map).
 * @returns A new TypeScript Map.
 */
export const makeMap = <K, V>(): Map<K, V> => {
  return new Map<K, V>()
}

/**
 * Returns the length of a collection (string, array, or map).
 * @param collection The collection to get the length of.
 * @returns The length of the collection.
 */
export const len = <T>(
  collection: string | Array<T> | Map<unknown, unknown>,
): number => {
  if (typeof collection === 'string' || Array.isArray(collection)) {
    return collection.length
  } else if (collection instanceof Map) {
    return collection.size
  }
  return 0 // Default fallback
}

/**
 * Returns the capacity of a slice (TypeScript array).
 * @param slice The slice (TypeScript array).
 * @returns The capacity of the slice.
 */
export const cap = <T>(slice: Array<T> & { __capacity?: number }): number => {
  return slice.__capacity !== undefined ? slice.__capacity : slice.length
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
export const runesToString = (runes: number[]): string => {
  return String.fromCharCode(...runes)
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
 * Appends elements to a slice (TypeScript array).
 * Note: In Go, append can return a new slice if the underlying array is reallocated.
 * This helper emulates that by returning the modified array.
 * @param slice The slice (TypeScript array) to append to.
 * @param elements The elements to append.
 * @returns The modified slice (TypeScript array).
 */
export const append = <T>(
  slice: Array<T> & { __capacity?: number },
  ...elements: T[]
): Array<T> & { __capacity?: number } => {
  slice.push(...elements)
  if (slice.__capacity !== undefined && slice.length > slice.__capacity) {
    slice.__capacity = slice.length
  }
  return slice
}

/**
 * Enum representing the kinds of Go types.
 */
export enum GoTypeKind {
  Basic,
  Pointer,
  Slice,
  Array, // reserved – not required for assertions yet
  Map,
  Chan,
  Struct,
  Interface,
  Func,
}

/**
 * Name & type of one struct field.
 */
export interface FieldInfo {
  name: string
  type: GoTypeInfo
  tag?: string // raw struct tag
  exported: boolean
}

/**
 * Name & type of one formal parameter or result.
 */
export interface VarInfo {
  type: GoTypeInfo
  // Parameter names are irrelevant for assignability => omitted
  isVariadic?: boolean // only for the last parameter
}

/**
 * Complete method signature *without receiver*.
 */
export interface MethodSig {
  name: string
  params: readonly VarInfo[]
  results: readonly VarInfo[]
}

/**
 * Represents a Go pointer in TypeScript.
 * A nil pointer is represented by `null`.
 * throwing an error for nil pointers and forwarding to the underlying reference.
 */
class goPtrProxy<T extends object> {
  public _ptr: T | null // Store the actual reference

  constructor(ref: T | null) {
    this._ptr = ref

    // Return a Proxy to intercept access
    return new Proxy(this, {
      get: (target, prop, receiver) => {
        // Handle access to the internal _ptr property directly
        if (prop === '_ptr') {
          return target._ptr
        }
        // Handle access to prototype properties (like constructor)
        if (
          Object.prototype.hasOwnProperty.call(target, prop) ||
          typeof prop === 'symbol'
        ) {
          return Reflect.get(target, prop, receiver)
        }

        // Check for nil pointer
        if (target._ptr === null) {
          throw new Error(
            `runtime error: invalid memory address or nil pointer dereference accessing property '${String(prop)}'`,
          )
        }

        // Forward access to the underlying referenced object
        const value = Reflect.get(target._ptr, prop, target._ptr)

        // If the accessed property is a function (method), bind it to the underlying object
        if (typeof value === 'function') {
          return value.bind(target._ptr)
        }

        return value
      },
      set: (target, prop, value, receiver) => {
        // Handle setting the internal _ptr property directly
        if (prop === '_ptr') {
          target._ptr = value
          return true
        }
        // Check for nil pointer
        if (target._ptr === null) {
          throw new Error(
            `runtime error: invalid memory address or nil pointer dereference setting property '${String(prop)}'`,
          )
        }

        // Forward setting to the underlying referenced object
        return Reflect.set(target._ptr, prop, value, target._ptr)
      },
      has: (target, prop) => {
        // Handle check for the internal _ptr property directly
        if (prop === '_ptr') {
          return true
        }
        // Check for nil pointer before checking property existence
        if (target._ptr === null) {
          // A nil pointer technically doesn't "have" any properties of the target type
          return false
        }
        // Forward check to the underlying referenced object
        return Reflect.has(target._ptr, prop)
      },
    }) as goPtrProxy<T>
  }
}

/**
 * Type alias for a Go pointer, which can be a goPtrProxy instance or null (for nil).
 * The `& T` part is crucial for TypeScript to understand that the pointer
 * should also satisfy the methods and properties of the underlying type T.
 * 
 * Note: This type is mainly used for primitive types. For struct and interface types,
 * we use T | null directly to represent both the value and pointer variants.
 */
export type Ptr<T extends object> = (goPtrProxy<T> & T) | null

/**
 * Creates a new Go pointer proxy wrapping the given value.
 * If the value is null or undefined, it returns null (representing a nil pointer).
 *
 * @param value The value to wrap in a pointer.
 * @returns A Ptr<T> instance or null.
 */
export function makePtr<T extends object>(value: T | null | undefined): Ptr<T> {
  if (value === null || value === undefined) {
    return null
  }
  return new goPtrProxy(value ?? null) as Ptr<T>
}

/**
 * Base interface with common properties for all Go type info interfaces
 */
interface BaseTypeInfo {
  readonly name?: string // present for named types
  readonly zero: any // canonical zero value
}

/**
 * Type information for basic types (string, int, bool, etc.)
 */
export interface BasicTypeInfo extends BaseTypeInfo {
  readonly kind: GoTypeKind.Basic
  readonly builtinName: string // 'string' | 'int' | 'bool' | etc.
}

/**
 * Type information for pointer types (*T)
 */
export interface PointerTypeInfo extends BaseTypeInfo {
  readonly kind: GoTypeKind.Pointer
  readonly elem: GoTypeInfo
}

/**
 * Type information for slice types ([]T)
 */
export interface SliceTypeInfo extends BaseTypeInfo {
  readonly kind: GoTypeKind.Slice
  readonly elem: GoTypeInfo
}

/**
 * Type information for map types (map[K]V)
 */
export interface MapTypeInfo extends BaseTypeInfo {
  readonly kind: GoTypeKind.Map
  readonly key: GoTypeInfo
  readonly value: GoTypeInfo
}

/**
 * Type information for channel types (chan T)
 */
export interface ChanTypeInfo extends BaseTypeInfo {
  readonly kind: GoTypeKind.Chan
  readonly elem: GoTypeInfo
  readonly dir: 'send' | 'recv' | 'both'
}

/**
 * Type information for function types (func(...) ...)
 */
export interface FuncTypeInfo extends BaseTypeInfo {
  readonly kind: GoTypeKind.Func
  readonly params: readonly VarInfo[]
  readonly results: readonly VarInfo[]
  readonly variadic: boolean // convenience flag
}

/**
 * Type information for struct types
 */
export interface StructTypeInfo extends BaseTypeInfo {
  readonly kind: GoTypeKind.Struct
  readonly fields: readonly FieldInfo[]
  readonly methods: readonly MethodSig[] // value methods (pointer recv omitted)
  readonly ctor?: new (...a: any[]) => any
}

/**
 * Type information for interface types
 */
export interface InterfaceTypeInfo extends BaseTypeInfo {
  readonly kind: GoTypeKind.Interface
  readonly methods: readonly MethodSig[]
}

/**
 * Union type of all Go type information interfaces
 */
export type GoTypeInfo =
  | BasicTypeInfo
  | PointerTypeInfo
  | SliceTypeInfo
  | MapTypeInfo
  | ChanTypeInfo
  | FuncTypeInfo
  | StructTypeInfo
  | InterfaceTypeInfo

/**
 * Creates a pointer type info for a given type
 * @param elemType The element type info
 * @returns A PointerTypeInfo object
 */
export function makePointerTypeInfo(elemType: GoTypeInfo): PointerTypeInfo {
  return {
    kind: GoTypeKind.Pointer,
    name: `*${elemType.name || 'unknown'}`,
    zero: null,
    elem: elemType
  }
}

// Define built-in type information constants
export const INT_TYPE: BasicTypeInfo = {
  kind: GoTypeKind.Basic,
  name: 'int',
  builtinName: 'int',
  zero: 0,
}

export const STRING_TYPE: BasicTypeInfo = {
  kind: GoTypeKind.Basic,
  name: 'string',
  builtinName: 'string',
  zero: '',
}

export const BOOL_TYPE: BasicTypeInfo = {
  kind: GoTypeKind.Basic,
  name: 'bool',
  builtinName: 'bool',
  zero: false,
}

export const FLOAT64_TYPE: BasicTypeInfo = {
  kind: GoTypeKind.Basic,
  name: 'float64',
  builtinName: 'float64',
  zero: 0.0,
}

export const BYTE_TYPE: BasicTypeInfo = {
  kind: GoTypeKind.Basic,
  name: 'byte',
  builtinName: 'byte',
  zero: 0,
}

export const RUNE_TYPE: BasicTypeInfo = {
  kind: GoTypeKind.Basic,
  name: 'rune',
  builtinName: 'rune',
  zero: 0,
}

export const NIL_TYPE: BasicTypeInfo = {
  kind: GoTypeKind.Basic,
  name: 'nil',
  builtinName: 'nil',
  zero: null,
}

export const EMPTY_INTERFACE_TYPE: InterfaceTypeInfo = {
  kind: GoTypeKind.Interface,
  name: 'interface{}',
  zero: null,
  methods: [],
}

export const ANY_TYPE: InterfaceTypeInfo = {
  kind: GoTypeKind.Interface,
  name: 'any',
  zero: null,
  methods: [],
}

export const ERROR_TYPE: InterfaceTypeInfo = {
  kind: GoTypeKind.Interface,
  name: 'error',
  zero: null,
  methods: [
    {
      name: 'Error',
      params: [],
      results: [{ type: STRING_TYPE }],
    },
  ],
}

/**
 * Gets the Go type of a value.
 *
 * @param value The value to get the type of
 * @returns The Go type information
 */
export function typeofGo(value: any): GoTypeInfo {
  // Handle null/undefined first
  if (value === null || value === undefined) {
    return NIL_TYPE
  }

  // Check if it's a pointer proxy
  if (isPointer(value)) {
    if (value._ptr === null) {
      return NIL_TYPE
    }
    // For pointers to structs/interfaces, we want to return the actual type
    // not the pointer type since we represent those as T | null
    const ptrType = value._ptr.__typeInfo
    if (ptrType && (ptrType.kind === GoTypeKind.Struct || ptrType.kind === GoTypeKind.Interface)) {
      return ptrType
    }
    // For other pointer types, return the pointer type info
    return makePointerTypeInfo(typeofGo(value._ptr))
  }

  // Check for type information on the value itself
  if (value && value.__typeInfo) {
    return value.__typeInfo
  }

  // Handle primitive types
  if (typeof value === 'string') {
    return STRING_TYPE
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return INT_TYPE
    }
    return FLOAT64_TYPE
  }
  if (typeof value === 'boolean') {
    return BOOL_TYPE
  }

  // Handle arrays/slices
  if (Array.isArray(value)) {
    // Try to determine element type from first element
    const elemType = value.length > 0 ? typeofGo(value[0]) : EMPTY_INTERFACE_TYPE
    return {
      kind: GoTypeKind.Slice,
      name: `[]${elemType.name || 'unknown'}`,
      zero: [],
      elem: elemType
    }
  }

  // Handle maps
  if (value instanceof Map) {
    // Try to determine key/value types from first entry
    let keyType = EMPTY_INTERFACE_TYPE
    let valueType = EMPTY_INTERFACE_TYPE
    const firstEntry = value.entries().next().value
    if (firstEntry) {
      keyType = typeofGo(firstEntry[0])
      valueType = typeofGo(firstEntry[1])
    }
    return {
      kind: GoTypeKind.Map,
      name: `map[${keyType.name || 'unknown'}]${valueType.name || 'unknown'}`,
      zero: new Map(),
      key: keyType,
      value: valueType
    }
  }

  // Default to interface{} for unknown types
  return EMPTY_INTERFACE_TYPE
}

// Helper function to check if a value is a Go pointer proxy by structure
function isPointer(value: any): value is Ptr<any> {
  // Check if it's an object (not null) and has the '_ptr' property
  return typeof value === 'object' && value !== null && '_ptr' in value
}

/**
 * Checks if a concrete type implements an interface.
 *
 * @param value The value to check
 * @param sourceType The source type info
 * @param iface The interface type information
 * @returns true if the value implements the interface
 */
function implementsInterface(
  value: any,
  sourceType: GoTypeInfo,
  iface: InterfaceTypeInfo,
): boolean {
  if (value === null || value === undefined) {
    return false // nil does not implement non-empty interfaces
  }

  // For empty interfaces, all values are assignable
  if (iface.methods.length === 0) {
    return true
  }

  // Get the method set from the source type if it's a struct
  let methods: MethodSig[] = []
  if (sourceType.kind === GoTypeKind.Struct) {
    methods = (sourceType as StructTypeInfo).methods || []
  }

  // Check each required method
  for (const req of iface.methods) {
    // First try to find the method in the declared methods
    const cand = methods.find((m) => m.name === req.name)

    // If method found and signatures match, continue
    if (cand && sigEqual(cand, req)) {
      continue
    }

    // Otherwise check if the method exists directly on the value
    if (
      typeof value === 'object' &&
      value !== null &&
      req.name in value &&
      typeof value[req.name] === 'function'
    ) {
      // Method exists on the value, but we can't easily verify its signature
      // For now, assume it's compatible (runtime will catch real incompatibilities)
      continue
    }

    // Method not found or incompatible signature
    return false
  }

  // All methods are properly implemented
  return true
}

/**
 * Checks if two method signatures are equal.
 *
 * @param a The first method signature
 * @param b The second method signature
 * @returns true if the signatures are equal
 */
function sigEqual(a: MethodSig, b: MethodSig): boolean {
  // Check name
  if (a.name !== b.name) {
    return false
  }

  // Check parameter count
  if (a.params.length !== b.params.length) {
    return false
  }

  // Check result count
  if (a.results.length !== b.results.length) {
    return false
  }

  // Check parameter types
  for (let i = 0; i < a.params.length; i++) {
    if (
      a.params[i].type !== b.params[i].type ||
      a.params[i].isVariadic !== b.params[i].isVariadic
    ) {
      return false
    }
  }

  // Check result types
  for (let i = 0; i < a.results.length; i++) {
    if (a.results[i].type !== b.results[i].type) {
      return false
    }
  }

  return true
}

/**
 * Represents the result of a type assertion.
 */
export interface TypeAssertResult<T> {
  value: T
  ok: boolean
}

/**
 * Performs a type assertion at runtime.
 *
 * @param value The value to assert
 * @param targetTypeInfo Information about the target type
 * @returns An object with the asserted value and whether the assertion succeeded
 */
export function typeAssert<T, V=unknown>(
  value: V,
  targetTypeInfo: GoTypeInfo,
): TypeAssertResult<T> {
  // Handle nil input value
  if (value == null) {
    // In Go, assertion from nil to interface types succeeds with nil result
    if (targetTypeInfo.kind === GoTypeKind.Interface) {
      return { value: null as T, ok: true }
    }
    // Assertion from nil to any non-interface type fails
    return { value: targetTypeInfo.zero as T, ok: false }
  }
  
  // Determine the source type
  const sourceType = typeofGo(value)
  
  // CASE 1: Target is an interface
  if (targetTypeInfo.kind === GoTypeKind.Interface) {
    // Check if the value implements the interface
    if (implementsInterface(value, sourceType, targetTypeInfo as InterfaceTypeInfo)) {
      return { value: value as T, ok: true }
    }
    // Interface assertion failed
    return { value: targetTypeInfo.zero as T, ok: false }
  }
  
  // CASE 2: Target is a struct
  if (targetTypeInfo.kind === GoTypeKind.Struct) {
    // For struct types, check if source matches target type
    if (sourceType === targetTypeInfo) {
      return { value: value as T, ok: true }
    }
    // If source is a pointer, check if it points to our target type
    if (isPointer(value)) {
      const ptrValue = (value as any)._ptr
      if (ptrValue && typeofGo(ptrValue) === targetTypeInfo) {
        return { value: ptrValue as T, ok: true }
      }
    }
    return { value: targetTypeInfo.zero as T, ok: false }
  }
  
  // CASE 3: Target is a pointer type
  if (targetTypeInfo.kind === GoTypeKind.Pointer) {
    const targetElemType = (targetTypeInfo as PointerTypeInfo).elem
    
    // If value is already a pointer, check if it points to the right type
    if (isPointer(value)) {
      const sourceElemType = sourceType === NIL_TYPE 
        ? typeofGo((value as any)._ptr)
        : sourceType
        
      if (sourceElemType === targetElemType) {
        return { value: value as T, ok: true }
      }
    } else {
      // If value is not a pointer but matches target element type,
      // we can create a pointer to it (like &value in Go)
      if (sourceType === targetElemType) {
        return { value: makePtr(value) as T, ok: true }
      }
    }
    return { value: targetTypeInfo.zero as T, ok: false }
  }
  
  // Type assertion failed
  return { value: targetTypeInfo.zero as T, ok: false }
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
  #stack: (() => void)[] = []

  /**
   * Adds a function to be executed when the stack is disposed.
   * @param fn The function to defer.
   */
  defer(fn: () => void): void {
    this.#stack.push(fn)
  }

  /**
   * Disposes of the resources in the stack by executing the deferred functions
   * in Last-In, First-Out (LIFO) order.
   * If a deferred function throws an error, disposal stops, and the error is rethrown,
   * similar to Go's panic behavior during defer execution.
   */
  [Symbol.dispose](): void {
    // Emulate Go: if a deferred throws, stop and rethrow
    while (this.#stack.length) {
      const fn = this.#stack.pop()!
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
  #stack: (() => Promise<void> | void)[] = []

  /**
   * Adds a synchronous or asynchronous function to be executed when the stack is disposed.
   * @param fn The function to defer. Can return void or a Promise<void>.
   */
  defer(fn: () => Promise<void> | void): void {
    this.#stack.push(fn)
  }

  /**
   * Asynchronously disposes of the resources in the stack by executing the deferred functions
   * sequentially in Last-In, First-Out (LIFO) order. It awaits each function if it returns a promise.
   */
  async [Symbol.asyncDispose](): Promise<void> {
    // Execute in LIFO order, awaiting each potentially async function
    for (let i = this.#stack.length - 1; i >= 0; --i) {
      await this.#stack[i]()
    }
  }
}
