import { Type, Kind, Value } from './type.js'

// Simple MapOf implementation using JavaScript Map
export function MapOf(key: Type, elem: Type): Type {
  return new MapType(key, elem)
}

// Simple map type implementation
class MapType implements Type {
  constructor(
    private _keyType: Type,
    private _elemType: Type,
  ) {}

  public String(): string {
    return `map[${this._keyType.String()}]${this._elemType.String()}`
  }

  public Kind(): Kind {
    return new Kind(21) // Map kind
  }

  public Size(): number {
    return 8 // pointer size
  }

  public Elem(): Type | null {
    return this._elemType
  }

  public Key(): Type | null {
    return this._keyType
  }

  public NumField(): number {
    return 0
  }
}

/**
 * MapIter provides an iterator interface for Go maps.
 * It wraps a JavaScript Map iterator and provides methods to iterate over key-value pairs.
 * @template K - The type of keys in the map
 * @template V - The type of values in the map
 */
export class MapIter<K = unknown, V = unknown> {
  public iterator: Iterator<[K, V]>
  public current: IteratorResult<[K, V]> | null = null

  constructor(public map: Map<K, V>) {
    this.iterator = map.entries()
    this.Next()
  }

  public Next(): boolean {
    this.current = this.iterator.next()
    return !this.current.done
  }

  public Key(): K | null {
    return this.current?.value?.[0] ?? null
  }

  public Value(): V | null {
    return this.current?.value?.[1] ?? null
  }

  public Reset(m: Map<K, V>): void {
    this.map = m
    this.iterator = m.entries()
    this.current = null
    this.Next()
  }
}

// Helper functions for map operations
export function MakeMap(typ: Type): Value {
  const map = new Map()
  return new Value(map, typ)
}

export function MakeMapWithSize(typ: Type, _n: number): Value {
  // JavaScript Map doesn't have initial size, so we ignore n
  return MakeMap(typ)
}
