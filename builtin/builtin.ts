/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Represents a Go pointer in TypeScript.
 * A nil pointer is represented by `null`.
 */
export class GoPtr<T> {
  constructor(public ref: T | null) {}
}

/**
 * Type alias for a Go pointer, which can be a GoPtr instance or null (for nil).
 */
export type Ptr<T> = GoPtr<T> | null;

/**
 * Creates a new Go pointer.
 * @param v The value the pointer refers to, or null for a nil pointer.
 * @returns A new Go pointer instance or null.
 */
export const newPtr = <T>(v: T | null): Ptr<T> => {
  if (v === null) {
    return null;
  }
  return new GoPtr(v);
};


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
  return String.fromCharCode(...runes);
};

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
  Array,     // reserved – not required for assertions yet
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
  tag?: string               // raw struct tag
  exported: boolean
}

/**
 * Name & type of one formal parameter or result.
 */
export interface VarInfo {
  type: GoTypeInfo
  // Parameter names are irrelevant for assignability => omitted
  isVariadic?: boolean       // only for the last parameter
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
 * Base interface for all Go type information.
 */
export interface GoTypeInfo {
  readonly kind: GoTypeKind
  readonly name?: string          // present for named types
  readonly zero: any              // canonical zero value
}

/**
 * Type information for basic types (string, int, bool, etc.)
 */
export interface BasicTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Basic
  readonly builtinName: string  // 'string' | 'int' | 'bool' | etc.
}

/**
 * Type information for pointer types (*T)
 */
export interface PointerTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Pointer
  readonly elem: GoTypeInfo
}

/**
 * Type information for slice types ([]T)
 */
export interface SliceTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Slice
  readonly elem: GoTypeInfo
}

/**
 * Type information for map types (map[K]V)
 */
export interface MapTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Map
  readonly key: GoTypeInfo
  readonly value: GoTypeInfo
}

/**
 * Type information for channel types (chan T)
 */
export interface ChanTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Chan
  readonly elem: GoTypeInfo
  readonly dir: 'send' | 'recv' | 'both'
}

/**
 * Type information for function types (func(...) ...)
 */
export interface FuncTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Func
  readonly params: readonly VarInfo[]
  readonly results: readonly VarInfo[]
  readonly variadic: boolean         // convenience flag
}

/**
 * Type information for struct types
 */
export interface StructTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Struct
  readonly fields: readonly FieldInfo[]
  readonly methods: readonly MethodSig[]   // value methods (pointer recv omitted)
  readonly ctor?: new (...a: any[]) => any
}

/**
 * Type information for interface types
 */
export interface InterfaceTypeInfo extends GoTypeInfo {
  readonly kind: GoTypeKind.Interface
  readonly methods: readonly MethodSig[]
}

// Global registry keyed by fully-qualified name OR synthetic signature.
const registry = new Map<string, GoTypeInfo>()

/**
 * Registers a type with the runtime type system and ensures canonicalization.
 * 
 * @param name The name of the type
 * @param kind The kind of the type
 * @param zero The zero value for the type
 * @param methods Optional set of methods (for interfaces/structs)
 * @param ctor Optional constructor (for structs)
 * @returns The canonicalized type information object
 */
export function registerType(
  name: string,
  kind: GoTypeKind,
  zero: any,
  methods?: Set<string> | MethodSig[],
  elemOrCtor?: GoTypeInfo | (new (...a: any[]) => any)
): GoTypeInfo {
  // Check if a type with this name (if named) is already registered
  if (name && registry.has(name)) {
    return registry.get(name)!;
  }

  let info: GoTypeInfo;
  const methodSigs = Array.isArray(methods) ? methods : [];

  // Construct the specific type info object directly
  switch (kind) {
    case GoTypeKind.Struct:
      info = {
        kind: GoTypeKind.Struct,
        name,
        zero,
        fields: [], // Fields would be populated by the compiler later if needed
        methods: methodSigs,
        ctor: elemOrCtor as (new (...a: any[]) => any) | undefined,
      } as StructTypeInfo;
      break;
    case GoTypeKind.Interface:
      info = {
        kind: GoTypeKind.Interface,
        name,
        zero,
        methods: methodSigs,
      } as InterfaceTypeInfo;
      break;
    case GoTypeKind.Basic:
      info = {
        kind: GoTypeKind.Basic,
        name,
        zero,
        builtinName: name, // For basic types, name and builtinName are the same
      } as BasicTypeInfo;
      break;
    // Add cases for Pointer, Slice, Map, Chan, Func as needed
    case GoTypeKind.Struct:
      info = {
        kind: GoTypeKind.Struct,
        name,
        zero,
        fields: [], // Fields would be populated by the compiler later if needed
        methods: methodSigs,
        ctor: elemOrCtor as (new (...a: any[]) => any) | undefined,
      } as StructTypeInfo;
      break;
    case GoTypeKind.Pointer:
      // For pointer types, the element type must be provided as the 'elemOrCtor' argument
      const elemType = elemOrCtor as GoTypeInfo;
      if (!elemType) {
        throw new Error(`Element type not provided for PointerTypeInfo registration: ${name}`);
      }
      info = {
        kind: GoTypeKind.Pointer,
        name,
        zero, // Should be null for pointers
        elem: elemType,
      } as PointerTypeInfo;
      break;
    // case GoTypeKind.Slice: // Slice type info handled by computeKey for now
    // case GoTypeKind.Map: // Map type info handled by computeKey for now
    // case GoTypeKind.Chan: // Chan type info handled by computeKey for now
    // case GoTypeKind.Func: // Func type info handled by computeKey for now
    default:
      // Fallback for unhandled kinds - might need more specific handling
      info = { kind, name, zero };
      break;
  }

  // Compute the final, canonical key now that the object is constructed
  const finalKey = computeKey(info);

  // Check registry again with the final key for unnamed types
  if (registry.has(finalKey)) {
    return registry.get(finalKey)!;
  }

  // Add the newly created type info to the registry
  registry.set(finalKey, info);
  // If it was a named type, also register it under its simple name if different
  if (name && finalKey !== name) {
      registry.set(name, info);
  }

  return info;
}

/**
 * Gets a type from the registry by its key.
 * 
 * @param key The type key
 * @returns The type information or undefined if not found
 */
export function getType(key: string): GoTypeInfo | undefined {
  return registry.get(key);
}

/**
 * Compute a unique key for a type.
 * - Named types: their package-qualified name
 * - Un-named composite types: textual canonical form
 * 
 * @param info The type information
 * @returns A unique string key
 */
function computeKey(info: GoTypeInfo): string {
  // For named types, use the qualified name
  if (info.name) {
    return info.name;
  }
  
  // For unnamed types, construct a canonical representation
  switch (info.kind) {
    case GoTypeKind.Pointer:
      return `*${computeKey((info as PointerTypeInfo).elem)}`;
    case GoTypeKind.Slice:
      return `[]${computeKey((info as SliceTypeInfo).elem)}`;
    case GoTypeKind.Map: {
      const mapInfo = info as MapTypeInfo;
      return `map[${computeKey(mapInfo.key)}]${computeKey(mapInfo.value)}`;
    }
    case GoTypeKind.Chan: {
      const chanInfo = info as ChanTypeInfo;
      return `chan ${computeKey(chanInfo.elem)}`;
    }
    case GoTypeKind.Func: {
      const funcInfo = info as FuncTypeInfo;
      const params = funcInfo.params.map(p => 
        computeKey(p.type) + (p.isVariadic ? '...' : '')).join(',');
      const results = funcInfo.results.map(r => computeKey(r.type)).join(',');
      return `func(${params}) (${results})`;
    }
    default:
      return `unknown-${info.kind}`;
  }
}

/**
 * Checks if a value is assignable to a target type.
 * 
 * @param value The value to check
 * @param target The target type
 * @returns true if the value is assignable to the target type
 */
export function isAssignable(value: any, target: GoTypeInfo): boolean {
  // Get the source type
  const sourceType = typeofGo(value);
  
  // Quick exit if identical reference (same canonical type)
  if (sourceType === target) {
    return true;
  }
  
  // For interface targets, check if source implements the interface
  if (target.kind === GoTypeKind.Interface) {
    return implementsInterface(sourceType, target as InterfaceTypeInfo);
  }
  
  // For other types, require exact type match
  return false;
}

/**
 * Gets the Go type of a value.
 * This is a simplified implementation for now.
 * 
 * @param value The value to get the type of
 * @returns The Go type information
 */
function typeofGo(value: any): GoTypeInfo {
  // For now, use a simple heuristic based on the constructor name and value type
  // This would be replaced with proper type tracking in the full implementation

  if (value === null || value === undefined) {
    return registry.get('nil')!;
  }

  // Handle the new GoPtr type
  if (value instanceof GoPtr) {
    // We need the element type of the pointer. This is not stored in GoPtr itself.
    // This highlights a limitation of this typeofGo heuristic.
    // A proper solution requires compiler-generated type information associated with values.
    // For now, we'll try to infer based on the constructor name of the *referenced* value.
    if (value.ref !== null && value.ref.constructor) {
      const refTypeName = value.ref.constructor.name;
      // Try to find the pointer type based on the referenced type name
      const ptrTypeName = `*${refTypeName}`;
      const ptrType = registry.get(ptrTypeName);
      if (ptrType && ptrType.kind === GoTypeKind.Pointer) {
        return ptrType;
      }
    }
    // Fallback if we can't determine the specific pointer type
    return registry.get('*interface{}')!; // Assuming *interface{} is registered
  }


  if (typeof value === 'string') {
    return registry.get('string')!;
  }

  if (typeof value === 'number') {
    // Simplification: return int for all numbers
    return registry.get('int')!;
  }

  if (typeof value === 'boolean') {
    return registry.get('bool')!;
  }

  if (Array.isArray(value)) {
    // For arrays, we'd need element type info for accuracy
    // This is simplified
    return registry.get('[]interface{}')!;
  }

  if (value instanceof Map) {
    // For maps, we'd need key/value type info for accuracy
    // This is simplified
    return registry.get('map[interface{}]interface{}')!;
  }

  // For objects (likely structs), use their constructor name to find the type
  if (typeof value === 'object' && value.constructor) {
    const typeName = value.constructor.name;
    const type = Array.from(registry.values()).find(t => t.name === typeName);
    if (type) {
      return type;
    }
  }

  // Default to interface{} for unknown types
  return registry.get('interface{}')!;
}

/**
 * Checks if a concrete type implements an interface.
 * 
 * @param concrete The concrete type
 * @param iface The interface type
 * @returns true if the concrete type implements the interface
 */
function implementsInterface(concrete: GoTypeInfo, iface: InterfaceTypeInfo): boolean {
  // For each required method in the interface
  for (const req of iface.methods) {
    // Find the method in the concrete type
    const cand = allMethodsOf(concrete).find(m => m.name === req.name);
    
    // If method not found or signatures don't match, return false
    if (!cand || !sigEqual(cand, req)) {
      return false;
    }
  }
  
  // All methods are implemented correctly
  return true;
}

/**
 * Gets all methods of a type, including methods from embedded types.
 * 
 * @param type The type to get methods for
 * @returns A readonly array of method signatures
 */
function allMethodsOf(type: GoTypeInfo): readonly MethodSig[] {
  switch (type.kind) {
    case GoTypeKind.Struct:
      return (type as StructTypeInfo).methods;
    case GoTypeKind.Pointer:
      // For pointers, get methods of the element type
      return allMethodsOf((type as PointerTypeInfo).elem);
    default:
      return [];
  }
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
    return false;
  }
  
  // Check parameter count
  if (a.params.length !== b.params.length) {
    return false;
  }
  
  // Check result count
  if (a.results.length !== b.results.length) {
    return false;
  }
  
  // Check parameter types
  for (let i = 0; i < a.params.length; i++) {
    if (a.params[i].type !== b.params[i].type || 
        a.params[i].isVariadic !== b.params[i].isVariadic) {
      return false;
    }
  }
  
  // Check result types
  for (let i = 0; i < a.results.length; i++) {
    if (a.results[i].type !== b.results[i].type) {
      return false;
    }
  }
  
  return true;
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
 * @param typeName The name of the target type
 * @returns An object with the asserted value and whether the assertion succeeded
 */
export function typeAssert<T>(
  value: any,
  typeName: string,
): TypeAssertResult<T> {
  // Get the type information from the registry
  const typeInfo = getType(typeName);
  if (!typeInfo) {
    console.warn(`Type information for '${typeName}' not found in registry.`);
    return { value: null as unknown as T, ok: false };
  }

  // If value is null or undefined, assertion fails
  if (value === null || value === undefined) {
    return { value: typeInfo.zero as T, ok: false };
  }

  // Check if the value is assignable to the target type
  // Special handling for assertion to pointer types
  if (typeInfo.kind === GoTypeKind.Pointer) {
  	const targetElemType = (typeInfo as PointerTypeInfo).elem;
  	// If the value is a GoPtr, check if its element is assignable to the target element type
  	if (value instanceof GoPtr) {
  		if (value.ref === null) {
  			// Nil pointer can be asserted to any pointer type
  			return { value: value as T, ok: true };
  		}
  		// Check if the referenced value is assignable to the target element type
  		if (isAssignable(value.ref, targetElemType)) {
  			return { value: value as T, ok: true };
  		}
  	} else {
  		// If the value is not a GoPtr, it can't be asserted to a pointer type
  		// In Go, a concrete value like MyStruct{} cannot be asserted to *MyStruct
  		return { value: null as unknown as T, ok: false };
  	}
  } else {
  	// For non-pointer targets, use the existing assignability check
  	if (isAssignable(value, typeInfo)) {
  		return { value: value as T, ok: true };
  	}
  }


  // Assertion failed
  return { value: typeInfo.zero as T, ok: false };
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
  #stack: (() => void)[] = [];

  /**
   * Adds a function to be executed when the stack is disposed.
   * @param fn The function to defer.
   */
  defer(fn: () => void): void { this.#stack.push(fn); }

  /**
   * Disposes of the resources in the stack by executing the deferred functions
   * in Last-In, First-Out (LIFO) order.
   * If a deferred function throws an error, disposal stops, and the error is rethrown,
   * similar to Go's panic behavior during defer execution.
   */
  [Symbol.dispose](): void {
    // Emulate Go: if a deferred throws, stop and rethrow
    while (this.#stack.length) {
      const fn = this.#stack.pop()!;
      fn();
    }
  }
}

/**
 * AsyncDisposableStack manages asynchronous disposable resources, mimicking Go's defer behavior.
 * Functions added via `defer` are executed sequentially in LIFO order when the stack is disposed.
 * Implements the `AsyncDisposable` interface for use with `await using` declarations.
 */
export class AsyncDisposableStack implements AsyncDisposable {
  #stack: (() => Promise<void> | void)[] = [];

  /**
   * Adds a synchronous or asynchronous function to be executed when the stack is disposed.
   * @param fn The function to defer. Can return void or a Promise<void>.
   */
  defer(fn: () => Promise<void> | void): void {
    this.#stack.push(fn);
  }

  /**
   * Asynchronously disposes of the resources in the stack by executing the deferred functions
   * sequentially in Last-In, First-Out (LIFO) order. It awaits each function if it returns a promise.
   */
  async [Symbol.asyncDispose](): Promise<void> {
    // Execute in LIFO order, awaiting each potentially async function
    for (let i = this.#stack.length - 1; i >= 0; --i) {
      await this.#stack[i]();
    }
  }
}

// Initialize the type information: register built-in types.
registerType('int', GoTypeKind.Basic, 0);
registerType('string', GoTypeKind.Basic, "");
registerType('bool', GoTypeKind.Basic, false);
// Add other basic types as needed (float64, byte, rune, etc.)
registerType('float64', GoTypeKind.Basic, 0.0);
registerType('byte', GoTypeKind.Basic, 0); // Assuming byte is alias for uint8 -> number
registerType('rune', GoTypeKind.Basic, 0); // Assuming rune is alias for int32 -> number
registerType('error', GoTypeKind.Interface, null, []); // Basic error interface
registerType('any', GoTypeKind.Interface, null, []); // Alias for interface{}
registerType('interface{}', GoTypeKind.Interface, null, []); // Empty interface

// Placeholder for nil type if needed for typeofGo
registerType('nil', GoTypeKind.Basic, null);
// Placeholder for simplified array/map types used in typeofGo
registerType('[]interface{}', GoTypeKind.Slice, null); // Simplified slice type
registerType('map[interface{}]interface{}', GoTypeKind.Map, null); // Simplified map type
// Placeholder for simplified pointer type used in typeofGo
registerType('*interface{}', GoTypeKind.Pointer, null, [], registry.get('interface{}')!); // *interface{}
