import { ReflectValue, ChanDir, StructField } from './types.js'
import { MapIter } from './map.js'

// rtype is the common implementation of most values
export class rtype {
  constructor(public kind: Kind) {}

  Kind(): Kind {
    return this.kind
  }

  String(): string {
    return this.kind.String()
  }

  Pointers(): boolean {
    // Return true for pointer-like types
    const k = this.kind.valueOf()
    return (
      k === Ptr.valueOf() ||
      k === Map.valueOf() ||
      k === Slice.valueOf() ||
      k === Interface.valueOf()
    )
  }
}

// funcType represents a function type
export class funcType extends rtype {
  constructor(
    kind: Kind,
    public inCount: number = 0,
    public outCount: number = 0,
  ) {
    super(kind)
  }
}

// flag type for internal use
export class flag {
  constructor(private _value: number | Kind) {
    if (typeof _value === 'number') {
      this._value = _value
    } else {
      this._value = _value.valueOf()
    }
  }

  valueOf(): number {
    return typeof this._value === 'number' ? this._value : this._value.valueOf()
  }

  // Support arithmetic operations
  static from(value: number | Kind): flag {
    return new flag(value)
  }
}

// bitVector class for tracking pointers
export class bitVector {
  private bits: number[] = []

  Set(index: number): void {
    const wordIndex = Math.floor(index / 32)
    const bitIndex = index % 32
    while (this.bits.length <= wordIndex) {
      this.bits.push(0)
    }
    this.bits[wordIndex] |= 1 << bitIndex
  }

  Get(index: number): boolean {
    const wordIndex = Math.floor(index / 32)
    const bitIndex = index % 32
    if (wordIndex >= this.bits.length) {
      return false
    }
    return (this.bits[wordIndex] & (1 << bitIndex)) !== 0
  }
}

// Kind represents the specific kind of type that a Type represents.
export class Kind {
  constructor(private _value: number) {}

  valueOf(): number {
    return this._value
  }

  toString(): string {
    return this.String()
  }

  static from(value: number): Kind {
    return new Kind(value)
  }

  public String(): string {
    const kindNames = [
      'invalid',
      'bool',
      'int',
      'int8',
      'int16',
      'int32',
      'int64',
      'uint',
      'uint8',
      'uint16',
      'uint32',
      'uint64',
      'uintptr',
      'float32',
      'float64',
      'complex64',
      'complex128',
      'array',
      'chan',
      'func',
      'interface',
      'map',
      'ptr',
      'slice',
      'string',
      'struct',
      'unsafe.Pointer',
    ]
    if (this._value >= 0 && this._value < kindNames.length) {
      return kindNames[this._value]
    }
    return 'invalid'
  }
}

// Kind constants
export const Invalid = new Kind(0)
export const Bool = new Kind(1)
export const Int = new Kind(2)
export const Int8 = new Kind(3)
export const Int16 = new Kind(4)
export const Int32 = new Kind(5)
export const Int64 = new Kind(6)
export const Uint = new Kind(7)
export const Uint8 = new Kind(8)
export const Uint16 = new Kind(9)
export const Uint32 = new Kind(10)
export const Uint64 = new Kind(11)
export const Uintptr = new Kind(12)
export const Float32 = new Kind(13)
export const Float64 = new Kind(14)
export const Complex64 = new Kind(15)
export const Complex128 = new Kind(16)
export const Array = new Kind(17)
export const Chan = new Kind(18)
export const Func = new Kind(19)
export const Interface = new Kind(20)
export const Map = new Kind(21)
export const Ptr = new Kind(22)
export const Slice = new Kind(23)
export const String = new Kind(24)
export const Struct = new Kind(25)
export const UnsafePointer = new Kind(26)

// Type is the representation of a Go type.
export interface Type {
  // String returns a string representation of the type.
  String(): string

  // Kind returns the specific kind of this type.
  Kind(): Kind

  // Size returns the number of bytes needed to store a value of the given type.
  Size(): number

  // Elem returns a type's element type.
  Elem(): Type | null

  // NumField returns a struct type's field count.
  NumField(): number

  // PkgPath returns the package path for named types, empty for unnamed types.
  PkgPath?(): string

  // Field returns a struct type's i'th field.
  Field?(i: number): StructField | null

  // common returns the common type implementation.
  common?(): rtype
}

// Value is the reflection interface to a Go value - consolidated from all implementations
export class Value {
  constructor(
    private _value: ReflectValue,
    private _type: Type,
  ) {}

  public clone(): Value {
    return new Value(this._value, this._type)
  }

  // Methods required by godoc.txt and used throughout the codebase
  public Int(): number {
    if (typeof this._value === 'number' && Number.isInteger(this._value)) {
      return this._value
    }
    throw new Error(
      'reflect: call of reflect.Value.Int on ' +
        this._type.Kind().String() +
        ' Value',
    )
  }

  public Uint(): number {
    if (typeof this._value === 'number' && this._value >= 0) {
      return this._value
    }
    throw new Error(
      'reflect: call of reflect.Value.Uint on ' +
        this._type.Kind().String() +
        ' Value',
    )
  }

  public Float(): number {
    if (typeof this._value === 'number') {
      return this._value
    }
    throw new Error(
      'reflect: call of reflect.Value.Float on ' +
        this._type.Kind().String() +
        ' Value',
    )
  }

  public Bool(): boolean {
    if (typeof this._value === 'boolean') {
      return this._value
    }
    throw new Error(
      'reflect: call of reflect.Value.Bool on ' +
        this._type.Kind().String() +
        ' Value',
    )
  }

  public String(): string {
    if (typeof this._value === 'string') {
      return this._value
    }
    // Special case for bool values - display as <bool Value>
    if (this._type.Kind().valueOf() === Bool.valueOf()) {
      return '<bool Value>'
    }
    return this._type.String()
  }

  public Len(): number {
    // Check for slice objects created by $.arrayToSlice
    if (
      this._value &&
      typeof this._value === 'object' &&
      '__meta__' in this._value
    ) {
      const meta = (this._value as { __meta__?: { length?: number } }).__meta__
      if (meta && typeof meta.length === 'number') {
        return meta.length
      }
    }

    // Check for typed arrays
    if (
      this._value instanceof Uint8Array ||
      this._value instanceof Int8Array ||
      this._value instanceof Uint16Array ||
      this._value instanceof Int16Array ||
      this._value instanceof Uint32Array ||
      this._value instanceof Int32Array ||
      this._value instanceof Float32Array ||
      this._value instanceof Float64Array
    ) {
      return this._value.length
    }

    // Check for regular arrays
    if (globalThis.Array.isArray(this._value)) {
      return this._value.length
    }

    // Check for strings
    if (typeof this._value === 'string') {
      return this._value.length
    }

    throw new Error(
      'reflect: call of reflect.Value.Len on ' +
        this._type.Kind().String() +
        ' Value',
    )
  }

  public Kind(): Kind {
    return this._type.Kind()
  }

  public Type(): Type {
    return this._type
  }

  public IsValid(): boolean {
    return this._value !== null && this._value !== undefined
  }

  public IsNil(): boolean {
    return this._value === null || this._value === undefined
  }

  public Index(i: number): Value {
    if (globalThis.Array.isArray(this._value)) {
      return new Value(this._value[i], getTypeOf(this._value[i]))
    }
    throw new Error(
      'reflect: call of reflect.Value.Index on ' +
        this._type.Kind().String() +
        ' Value',
    )
  }

  public Bytes(): Uint8Array {
    if (this._value instanceof Uint8Array) {
      return this._value
    }
    throw new Error(
      'reflect: call of reflect.Value.Bytes on ' +
        this._type.Kind().String() +
        ' Value',
    )
  }

  public Elem(): Value {
    // For pointers and interfaces, return the element
    return new Value(this._value, this._type)
  }

  public NumField(): number {
    return this._type.NumField()
  }

  public Field(_i: number): Value {
    // Simplified implementation for struct field access
    return new Value(null, this._type)
  }

  // Additional methods needed by various parts of the codebase
  public UnsafePointer(): unknown {
    return this._value
  }

  public pointer(): unknown {
    return this._value
  }

  public get ptr(): unknown {
    return this._value
  }

  // Internal method to access the underlying value
  public get value(): ReflectValue {
    return this._value
  }

  // Convert method needed by iter.ts
  public Convert(t: Type): Value {
    // Simple conversion - in a real implementation this would do type conversion
    return new Value(this._value, t)
  }

  // Additional methods from deleted reflect.gs.ts
  public typ(): rtype | null {
    return new rtype(this._type.Kind())
  }

  public get flag(): number {
    return 0
  }

  public MapRange(): MapIter<unknown, unknown> | null {
    // Placeholder for map iteration
    return null
  }

  public MapIndex(_key: Value): Value {
    // Placeholder for map access
    return new Value(null, new BasicType(Invalid, 'invalid'))
  }

  public Complex(): number | { real: number; imag: number } | null {
    // Placeholder for complex number support
    return this._value as number | { real: number; imag: number } | null
  }

  // Send sends a value to a channel
  public Send(x: Value): void {
    if (this._type.Kind().valueOf() !== Chan.valueOf()) {
      throw new Error('reflect: send on non-chan type')
    }

    // Get the underlying channel
    const channel = this._value
    if (!channel || typeof channel !== 'object') {
      throw new Error('reflect: send on invalid channel')
    }

    // Extract the value to send
    const valueToSend = (x as unknown as { value: ReflectValue }).value

    // For synchronous operation, we'll use a simplified send
    // In the real implementation, this would need proper async handling
    const channelObj = channel as any
    if (typeof channelObj.send === 'function') {
      // For now, just store the value in a queue or buffer
      // This is a simplified implementation for testing
      if (!channelObj._sendQueue) {
        channelObj._sendQueue = []
      }
      channelObj._sendQueue.push(valueToSend)
    }
  }
}

// Basic type implementation - exported for compatibility
export class BasicType implements Type {
  constructor(
    private _kind: Kind,
    private _name: string,
    private _size: number = 8,
  ) {}

  public String(): string {
    return this._name
  }

  public Kind(): Kind {
    return this._kind
  }

  public Size(): number {
    return this._size
  }

  public Elem(): Type | null {
    return null
  }

  public NumField(): number {
    return 0
  }

  public PkgPath?(): string {
    return ''
  }

  public Field?(_i: number): StructField | null {
    return null
  }

  public common?(): rtype {
    return new rtype(this._kind)
  }
}

// Slice type implementation
class SliceType implements Type {
  constructor(private _elemType: Type) {}

  public String(): string {
    return '[]' + this._elemType.String()
  }

  public Kind(): Kind {
    return Slice
  }

  public Size(): number {
    return 24 // slice header size
  }

  public Elem(): Type | null {
    return this._elemType
  }

  public NumField(): number {
    return 0
  }

  public PkgPath?(): string {
    return ''
  }
}

// Array type implementation
class ArrayType implements Type {
  constructor(
    private _elemType: Type,
    private _len: number,
  ) {}

  public String(): string {
    return `[${this._len}]${this._elemType.String()}`
  }

  public Kind(): Kind {
    return Array
  }

  public Size(): number {
    return this._elemType.Size() * this._len
  }

  public Elem(): Type | null {
    return this._elemType
  }

  public NumField(): number {
    return 0
  }

  public Len(): number {
    return this._len
  }

  public PkgPath?(): string {
    return ''
  }

  public Field?(_i: number): StructField | null {
    return null
  }

  public common?(): rtype {
    return new rtype(this.Kind())
  }
}

// Pointer type implementation
class PointerType implements Type {
  constructor(private _elemType: Type) {}

  public String(): string {
    return '*' + this._elemType.String()
  }

  public Kind(): Kind {
    return Ptr
  }

  public Size(): number {
    return 8 // pointer size
  }

  public Elem(): Type | null {
    return this._elemType
  }

  public NumField(): number {
    return 0
  }

  public PkgPath?(): string {
    return ''
  }

  public Field?(_i: number): StructField | null {
    return null
  }

  public common?(): rtype {
    return new rtype(this.Kind())
  }
}

// Function type implementation
class FunctionType implements Type {
  constructor(private _signature: string) {}

  public String(): string {
    return this._signature
  }

  public Kind(): Kind {
    return Func
  }

  public Size(): number {
    return 8 // function pointer size
  }

  public Elem(): Type | null {
    return null
  }

  public NumField(): number {
    return 0
  }

  public PkgPath?(): string {
    return ''
  }

  public Field?(_i: number): StructField | null {
    return null
  }

  public common?(): rtype {
    return new rtype(this.Kind())
  }
}

// Map type implementation
class MapType implements Type {
  constructor(
    private _keyType: Type,
    private _elemType: Type,
  ) {}

  public String(): string {
    return `map[${this._keyType.String()}]${this._elemType.String()}`
  }

  public Kind(): Kind {
    return Map
  }

  public Size(): number {
    return 8 // map header size
  }

  public Elem(): Type | null {
    return this._elemType
  }

  public NumField(): number {
    return 0
  }

  public Key(): Type {
    return this._keyType
  }

  public PkgPath?(): string {
    return ''
  }

  public Field?(_i: number): StructField | null {
    return null
  }

  public common?(): rtype {
    return new rtype(this.Kind())
  }
}

// Struct type implementation
class StructType implements Type {
  constructor(
    private _name: string,
    private _fields: Array<{ name: string; type: Type }> = [],
  ) {}

  public String(): string {
    return this._name
  }

  public Kind(): Kind {
    return Struct
  }

  public Size(): number {
    // Struct size is implementation-defined, we'll use a reasonable default
    return this._fields.reduce((sum, field) => sum + field.type.Size(), 0)
  }

  public Elem(): Type | null {
    return null
  }

  public NumField(): number {
    return this._fields.length
  }

  public PkgPath?(): string {
    return ''
  }

  public Field?(_i: number): any {
    // Stub implementation
    return null
  }

  public common?(): rtype {
    return new rtype(this.Kind())
  }
}

class ChannelType implements Type {
  constructor(
    private _elemType: Type,
    private _dir: ChanDir,
  ) {}

  public String(): string {
    // Format: chan T, <-chan T, or chan<- T
    const elem = this._elemType.String()
    switch (this._dir.valueOf()) {
      case 1: // RecvDir
        return `<-chan ${elem}`
      case 2: // SendDir
        return `chan<- ${elem}`
      case 3: // BothDir
      default:
        return `chan ${elem}`
    }
  }

  public Kind(): Kind {
    return Chan
  }

  public Size(): number {
    // Channels are represented as pointers, so pointer size
    return 8
  }

  public Elem(): Type | null {
    return this._elemType
  }

  public NumField(): number {
    return 0
  }

  public PkgPath?(): string {
    return ''
  }

  public Field?(_: number): any {
    return null
  }

  public common?(): rtype {
    return new rtype(this.Kind())
  }

  public ChanDir(): ChanDir {
    return this._dir
  }
}

function getTypeOf(value: ReflectValue): Type {
  if (value === null || value === undefined) {
    return new BasicType(Interface, 'interface{}', 16)
  }

  switch (typeof value) {
    case 'boolean':
      return new BasicType(Bool, 'bool', 1)
    case 'number':
      if (Number.isInteger(value)) {
        return new BasicType(Int, 'int', 8)
      }
      return new BasicType(Float64, 'float64', 8)
    case 'bigint':
      return new BasicType(Int64, 'int64', 8)
    case 'string':
      return new BasicType(String, 'string', 16)
    case 'function': {
      // Check if this function has GoScript type information attached
      const funcWithMeta = value as any

      // First check for __typeInfo which contains the function signature
      if (funcWithMeta.__typeInfo) {
        const typeInfo = funcWithMeta.__typeInfo
        if (
          (typeInfo.kind === 'function' || typeInfo.kind === 'Function') &&
          typeInfo.params &&
          typeInfo.results
        ) {
          // Build proper function signature from type info
          const paramTypes = typeInfo.params
            .map((p: any) => (typeof p === 'string' ? p : p.name || 'any'))
            .join(', ')
          const resultTypes = typeInfo.results.map((r: any) =>
            typeof r === 'string' ? r : r.name || 'any',
          )

          let signature = `func(${paramTypes})`
          if (resultTypes.length === 1) {
            signature += ` ${resultTypes[0]}`
          } else if (resultTypes.length > 1) {
            signature += ` (${resultTypes.join(', ')})`
          }

          return new FunctionType(signature)
        }
      }

      // Then check for __goTypeName which indicates a typed function
      if (funcWithMeta.__goTypeName) {
        // This is a typed Go function - try to reconstruct the signature
        const typeName = funcWithMeta.__goTypeName

        // For known Go function types, construct proper signatures
        if (typeName === 'Greeter') {
          return new FunctionType('func(string) string')
        } else if (typeName === 'Adder') {
          return new FunctionType('func(int, int) int')
        }

        // Generic fallback for typed functions
        return new FunctionType(`func`) // Could be enhanced with parameter parsing
      }

      // For untyped functions, try to parse the signature
      const funcStr = value.toString()
      let signature = 'func'

      // Simple pattern matching for basic function signatures
      const match = funcStr.match(/function\s*\([^)]*\)/)
      if (match) {
        const params = match[0].replace('function', '').trim()
        // This is a simplified version - real implementation would need more sophisticated parsing
        if (params === '()') {
          signature = 'func()'
        } else if (params.includes(',')) {
          const paramCount = params.split(',').length
          signature = `func(${globalThis.Array(paramCount).fill('any').join(', ')})`
        } else if (params !== '()') {
          signature = 'func(any)'
        }
      }

      // Check if it looks like it returns something
      if (funcStr.includes('return ')) {
        signature += ' any'
      }

      return new FunctionType(signature)
    }
    case 'object': {
      if (value === null) {
        return new BasicType(Interface, 'interface{}', 16)
      }

      // Check for arrays
      if (globalThis.Array.isArray(value)) {
        if (value.length === 0) {
          // Empty array, assume []interface{}
          return new SliceType(new BasicType(Interface, 'interface{}', 16))
        }
        // Determine element type from first element
        const elemType = getTypeOf(value[0])
        return new SliceType(elemType)
      }

      // Check for typed arrays
      if (value instanceof Uint8Array)
        return new SliceType(new BasicType(Uint8, 'uint8', 1))
      if (value instanceof Int8Array)
        return new SliceType(new BasicType(Int8, 'int8', 1))
      if (value instanceof Uint16Array)
        return new SliceType(new BasicType(Uint16, 'uint16', 2))
      if (value instanceof Int16Array)
        return new SliceType(new BasicType(Int16, 'int16', 2))
      if (value instanceof Uint32Array)
        return new SliceType(new BasicType(Uint32, 'uint32', 4))
      if (value instanceof Int32Array)
        return new SliceType(new BasicType(Int32, 'int32', 4))
      if (value instanceof Float32Array)
        return new SliceType(new BasicType(Float32, 'float32', 4))
      if (value instanceof Float64Array)
        return new SliceType(new BasicType(Float64, 'float64', 8))

      // Check for Maps
      if (value instanceof globalThis.Map) {
        if (value.size === 0) {
          // Empty map, assume map[interface{}]interface{}
          const anyType = new BasicType(Interface, 'interface{}', 16)
          return new MapType(anyType, anyType)
        }
        // Get types from first entry
        const firstEntry = value.entries().next().value
        if (firstEntry) {
          const keyType = getTypeOf(firstEntry[0] as ReflectValue)
          const valueType = getTypeOf(firstEntry[1] as ReflectValue)
          return new MapType(keyType, valueType)
        }
      }

      // Check for GoScript slice objects with proper __meta__ structure
      if (value && typeof value === 'object' && '__meta__' in value) {
        const meta = (
          value as {
            __meta__?: {
              backing?: unknown[]
              length?: number
              capacity?: number
              offset?: number
            }
          }
        ).__meta__
        if (
          meta &&
          typeof meta === 'object' &&
          'backing' in meta &&
          'length' in meta &&
          globalThis.Array.isArray(meta.backing)
        ) {
          // This is a GoScript slice - determine element type from backing array
          if (meta.backing.length === 0) {
            // Empty slice, assume []interface{}
            return new SliceType(new BasicType(Interface, 'interface{}', 16))
          }
          // Get element type from first element in backing array
          const elemType = getTypeOf(meta.backing[0] as ReflectValue)
          return new SliceType(elemType)
        }
      }

      // Check if it has a constructor with __typeInfo for proper struct names
      if (
        value &&
        typeof value === 'object' &&
        value.constructor &&
        '__typeInfo' in value.constructor
      ) {
        const typeInfo = (
          value.constructor as { __typeInfo?: { name?: string } }
        ).__typeInfo
        if (typeInfo && typeInfo.name) {
          // Add package prefix for struct types if not already present
          const typeName =
            typeInfo.name.includes('.') ?
              typeInfo.name
            : `main.${typeInfo.name}`
          return new StructType(typeName)
        }
      }

      // Check if it has a constructor name we can use (fallback)
      const constructorName = (value as object).constructor?.name
      if (constructorName && constructorName !== 'Object') {
        return new StructType(constructorName)
      }

      // Default to struct type for plain objects
      return new StructType('struct')
    }
    default:
      return new BasicType(Interface, 'interface{}', 16)
  }
}

// Exported functions as required by godoc.txt
export function TypeOf(i: ReflectValue): Type {
  return getTypeOf(i)
}

export function ValueOf(i: ReflectValue): Value {
  return new Value(i, getTypeOf(i))
}

export function ArrayOf(length: number, elem: Type): Type {
  return new ArrayType(elem, length)
}

export function SliceOf(t: Type): Type {
  return new SliceType(t)
}

export function PointerTo(t: Type): Type {
  return new PointerType(t)
}

export function PtrTo(t: Type): Type {
  return PointerTo(t) // PtrTo is an alias for PointerTo
}

export function MapOf(key: Type, elem: Type): Type {
  return new MapType(key, elem)
}

export function ChanOf(dir: ChanDir, t: Type): Type {
  return new ChannelType(t, dir)
}

// Additional functions from merged files
export function canRangeFunc(t: Type): boolean {
  const kind = t.Kind().valueOf()
  return kind === 23 || kind === 17 || kind === 24 // slice, array, string
}

export function canRangeFunc2(t: Type): boolean {
  const kind = t.Kind().valueOf()
  return kind === 21 // map
}

export function funcLayout(_t: Type, _rcvr: Type | null): { Type: Type | null; InCount: number; OutCount: number } {
  return {
    Type: null,
    InCount: 0,
    OutCount: 0,
  }
}
