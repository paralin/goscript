// Common types used throughout the reflect module

// Basic Go types that need TypeScript equivalents
export type uintptr = number

// Define a proper type-safe Pointer type
export interface UnsafePointer {
  readonly __unsafePointerBrand: unique symbol
  value: unknown
}

export type Pointer = UnsafePointer | null

// Define the possible JavaScript values that can be reflected
export type ReflectValue =
  | null
  | undefined
  | boolean
  | number
  | bigint
  | string
  | symbol
  | Function //eslint-disable-line @typescript-eslint/no-unsafe-function-type
  | object
  | unknown[]
  | Map<unknown, unknown>
  | Set<unknown>
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array

// Import Type and Kind from the main type module
import { Type, Kind, Value, Kind_String, ChanDir } from './type.js'

// Struct field representation
export class StructField {
  public Name: string = ''
  public Type!: Type
  public Tag?: StructTag
  public Offset?: uintptr
  public Index?: number[]
  public Anonymous?: boolean

  constructor(init?: Partial<StructField>) {
    if (init) {
      Object.assign(this, init)
    }
  }

  public clone(): StructField {
    return new StructField({
      Name: this.Name,
      Type: this.Type,
      Tag: this.Tag,
      Offset: this.Offset,
      Index: this.Index ? [...this.Index] : undefined,
      Anonymous: this.Anonymous,
    })
  }
}

// Struct tag type
export class StructTag {
  constructor(private _value: string) {}

  toString(): string {
    return this._value
  }

  Get(key: string): string {
    // Simple tag parsing - in a real implementation this would be more sophisticated
    const parts = this._value.split(' ')
    for (const part of parts) {
      if (part.startsWith(key + ':')) {
        const value = part.substring(key.length + 1)
        if (value.startsWith('"') && value.endsWith('"')) {
          return value.slice(1, -1)
        }
        return value
      }
    }
    return ''
  }
}

// Method representation
export interface Method {
  Name: string
  Type: Type
  Func: Function //eslint-disable-line @typescript-eslint/no-unsafe-function-type
  Index: number
}

// Channel type for reflection
export interface Channel<T = unknown> {
  readonly __channelBrand: unique symbol
  direction: ChanDir
  elementType: Type
  buffer: T[]
  closed: boolean
}

// Select case for channel operations
export interface SelectCase {
  Dir: SelectDir
  Chan?: Value // Value representing a channel - optional since default cases don't need it
  Send?: Value // Value to send (if Dir is SendDir) - optional since only needed for send cases
}

// Select direction constants
export class SelectDir {
  constructor(private _value: number) {}

  valueOf(): number {
    return this._value
  }
}

export const SelectSend = new SelectDir(1)
export const SelectRecv = new SelectDir(2)
export const SelectDefault = new SelectDir(3)

// Slice header (internal representation)
export interface SliceHeader {
  Data: uintptr
  Len: number
  Cap: number
}

// String header (internal representation)
export interface StringHeader {
  Data: uintptr
  Len: number
}

// Map iterator with proper typing
export interface MapIter<K = unknown, V = unknown> {
  map: Map<K, V>
  iterator: Iterator<[K, V]>
  current: IteratorResult<[K, V]> | null
  Key(): K | null
  Value(): V | null
  Next(): boolean
  Reset(m: Map<K, V>): void
}

// Bit vector for tracking pointers
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

// Value error type
export class ValueError extends Error {
  public Kind: Kind
  public Method: string

  constructor(init: { Kind: Kind; Method: string }) {
    super(
      `reflect: call of reflect.Value.${init.Method} on ${Kind_String(init.Kind)} Value`,
    )
    this.Kind = init.Kind
    this.Method = init.Method
    this.name = 'ValueError'
  }
}
