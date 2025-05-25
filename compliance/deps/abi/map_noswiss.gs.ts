import * as $ from "@goscript/builtin/builtin.js";

import * as unsafe from "@goscript/unsafe/index.js"

// Maximum number of key/elem pairs a bucket can hold.
// log2 of number of elements in a bucket.
export let OldMapBucketCountBits: number = 3

export let OldMapBucketCount: number = (1 << 3)

// Maximum key or elem size to keep inline (instead of mallocing per element).
// Must fit in a uint8.
// Note: fast map functions cannot handle big elems (bigger than MapMaxElemBytes).
export let OldMapMaxKeyBytes: number = 128

// Must fit in a uint8.
export let OldMapMaxElemBytes: number = 128

export class OldMapType {
	public get Key(): Type | null {
		return this._fields.Key.value
	}
	public set Key(value: Type | null) {
		this._fields.Key.value = value
	}

	public get Elem(): Type | null {
		return this._fields.Elem.value
	}
	public set Elem(value: Type | null) {
		this._fields.Elem.value = value
	}

	// internal type representing a hash bucket
	public get Bucket(): Type | null {
		return this._fields.Bucket.value
	}
	public set Bucket(value: Type | null) {
		this._fields.Bucket.value = value
	}

	// function for hashing keys (ptr to key, seed) -> hash
	public get Hasher(): ((p0: Pointer, p1: uintptr) => uintptr) | null {
		return this._fields.Hasher.value
	}
	public set Hasher(value: ((p0: Pointer, p1: uintptr) => uintptr) | null) {
		this._fields.Hasher.value = value
	}

	// size of key slot
	public get KeySize(): number {
		return this._fields.KeySize.value
	}
	public set KeySize(value: number) {
		this._fields.KeySize.value = value
	}

	// size of elem slot
	public get ValueSize(): number {
		return this._fields.ValueSize.value
	}
	public set ValueSize(value: number) {
		this._fields.ValueSize.value = value
	}

	// size of bucket
	public get BucketSize(): number {
		return this._fields.BucketSize.value
	}
	public set BucketSize(value: number) {
		this._fields.BucketSize.value = value
	}

	public get Flags(): number {
		return this._fields.Flags.value
	}
	public set Flags(value: number) {
		this._fields.Flags.value = value
	}

	public get Type(): Type {
		return this._fields.Type.value
	}
	public set Type(value: Type) {
		this._fields.Type.value = value
	}

	public _fields: {
		Type: $.VarRef<Type>;
		Key: $.VarRef<Type | null>;
		Elem: $.VarRef<Type | null>;
		Bucket: $.VarRef<Type | null>;
		Hasher: $.VarRef<((p0: Pointer, p1: uintptr) => uintptr) | null>;
		KeySize: $.VarRef<number>;
		ValueSize: $.VarRef<number>;
		BucketSize: $.VarRef<number>;
		Flags: $.VarRef<number>;
	}

	constructor(init?: Partial<{Bucket?: Type | null, BucketSize?: number, Elem?: Type | null, Flags?: number, Hasher?: ((p0: Pointer, p1: uintptr) => uintptr) | null, Key?: Type | null, KeySize?: number, Type?: Partial<ConstructorParameters<typeof Type>[0]>, ValueSize?: number}>) {
		this._fields = {
			Type: $.varRef(new Type(init?.Type)),
			Key: $.varRef(init?.Key ?? null),
			Elem: $.varRef(init?.Elem ?? null),
			Bucket: $.varRef(init?.Bucket ?? null),
			Hasher: $.varRef(init?.Hasher ?? null),
			KeySize: $.varRef(init?.KeySize ?? 0),
			ValueSize: $.varRef(init?.ValueSize ?? 0),
			BucketSize: $.varRef(init?.BucketSize ?? 0),
			Flags: $.varRef(init?.Flags ?? 0)
		}
	}

	public clone(): OldMapType {
		const cloned = new OldMapType()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value.clone()),
			Key: $.varRef(this._fields.Key.value),
			Elem: $.varRef(this._fields.Elem.value),
			Bucket: $.varRef(this._fields.Bucket.value),
			Hasher: $.varRef(this._fields.Hasher.value),
			KeySize: $.varRef(this._fields.KeySize.value),
			ValueSize: $.varRef(this._fields.ValueSize.value),
			BucketSize: $.varRef(this._fields.BucketSize.value),
			Flags: $.varRef(this._fields.Flags.value)
		}
		return cloned
	}

	// Note: flag values must match those used in the TMAP case
	// in ../cmd/compile/internal/reflectdata/reflect.go:writeType.
	public IndirectKey(): boolean {
		const mt = this
		return (mt!.Flags & 1) != 0
	}

	public IndirectElem(): boolean {
		const mt = this
		return (mt!.Flags & 2) != 0
	}

	public ReflexiveKey(): boolean {
		const mt = this
		return (mt!.Flags & 4) != 0
	}

	public NeedKeyUpdate(): boolean {
		const mt = this
		return (mt!.Flags & 8) != 0
	}

	public HashMightPanic(): boolean {
		const mt = this
		return (mt!.Flags & 16) != 0
	}

	public get Size_(): uintptr {
		return this.Type.Size_
	}
	public set Size_(value: uintptr) {
		this.Type.Size_ = value
	}

	public get PtrBytes(): uintptr {
		return this.Type.PtrBytes
	}
	public set PtrBytes(value: uintptr) {
		this.Type.PtrBytes = value
	}

	public get Hash(): number {
		return this.Type.Hash
	}
	public set Hash(value: number) {
		this.Type.Hash = value
	}

	public get TFlag(): TFlag {
		return this.Type.TFlag
	}
	public set TFlag(value: TFlag) {
		this.Type.TFlag = value
	}

	public get Align_(): number {
		return this.Type.Align_
	}
	public set Align_(value: number) {
		this.Type.Align_ = value
	}

	public get FieldAlign_(): number {
		return this.Type.FieldAlign_
	}
	public set FieldAlign_(value: number) {
		this.Type.FieldAlign_ = value
	}

	public get Kind_(): Kind {
		return this.Type.Kind_
	}
	public set Kind_(value: Kind) {
		this.Type.Kind_ = value
	}

	public get Equal(): ((p0: Pointer, p1: Pointer) => boolean) | null {
		return this.Type.Equal
	}
	public set Equal(value: ((p0: Pointer, p1: Pointer) => boolean) | null) {
		this.Type.Equal = value
	}

	public get GCData(): $.VarRef<number> | null {
		return this.Type.GCData
	}
	public set GCData(value: $.VarRef<number> | null) {
		this.Type.GCData = value
	}

	public get Str(): NameOff {
		return this.Type.Str
	}
	public set Str(value: NameOff) {
		this.Type.Str = value
	}

	public get PtrToThis(): TypeOff {
		return this.Type.PtrToThis
	}
	public set PtrToThis(value: TypeOff) {
		this.Type.PtrToThis = value
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'OldMapType',
	  new OldMapType(),
	  [{ name: "IndirectKey", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "IndirectElem", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "ReflexiveKey", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "NeedKeyUpdate", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "HashMightPanic", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  OldMapType,
	  {"Type": "Type", "Key": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Elem": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Bucket": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Hasher": { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Basic, name: "Pointer" }, { kind: $.TypeKind.Basic, name: "uintptr" }], results: [{ kind: $.TypeKind.Basic, name: "uintptr" }] }, "KeySize": { kind: $.TypeKind.Basic, name: "number" }, "ValueSize": { kind: $.TypeKind.Basic, name: "number" }, "BucketSize": { kind: $.TypeKind.Basic, name: "number" }, "Flags": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

