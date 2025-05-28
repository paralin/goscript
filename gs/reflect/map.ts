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

// Simple map iterator using JavaScript Map
export class MapIter {
  private iterator: Iterator<[any, any]>
  private currentEntry: IteratorResult<[any, any]> | null = null

  constructor(private map: Map<any, any>) {
    this.iterator = map.entries()
    this.Next()
  }

  public Next(): boolean {
    this.currentEntry = this.iterator.next()
    return !this.currentEntry.done
  }

  public Key(): any {
    return this.currentEntry?.value?.[0]
  }

  public Value(): any {
    return this.currentEntry?.value?.[1]
  }

  public Reset(m: any): void {
    if (m instanceof Map) {
      this.map = m
      this.iterator = m.entries()
      this.Next()
    }
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
