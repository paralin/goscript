import * as $ from "@goscript/builtin/builtin.js";

import * as unsafe from "@goscript/unsafe/index.js"

// Number of bits in the group.slot count.
export let SwissMapGroupSlotsBits: number = 3

// Number of slots in a group.
// 8
export let SwissMapGroupSlots: number = (1 << 3)

// Maximum key or elem size to keep inline (instead of mallocing per element).
// Must fit in a uint8.
export let SwissMapMaxKeyBytes: number = 128

export let SwissMapMaxElemBytes: number = 128

let ctrlEmpty: number = 0b10000000

let bitsetLSB: number = 0x0101010101010101

// Value of control word with all empty slots.
export let SwissMapCtrlEmpty: number = 72340172838076673 * (128 as number)

export class SwissMapType {
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

	// internal type representing a slot group
	public get Group(): Type | null {
		return this._fields.Group.value
	}
	public set Group(value: Type | null) {
		this._fields.Group.value = value
	}

	// function for hashing keys (ptr to key, seed) -> hash
	public get Hasher(): ((p0: Pointer, p1: uintptr) => uintptr) | null {
		return this._fields.Hasher.value
	}
	public set Hasher(value: ((p0: Pointer, p1: uintptr) => uintptr) | null) {
		this._fields.Hasher.value = value
	}

	// == Group.Size_
	public get GroupSize(): uintptr {
		return this._fields.GroupSize.value
	}
	public set GroupSize(value: uintptr) {
		this._fields.GroupSize.value = value
	}

	// size of key/elem slot
	public get SlotSize(): uintptr {
		return this._fields.SlotSize.value
	}
	public set SlotSize(value: uintptr) {
		this._fields.SlotSize.value = value
	}

	// offset of elem in key/elem slot
	public get ElemOff(): uintptr {
		return this._fields.ElemOff.value
	}
	public set ElemOff(value: uintptr) {
		this._fields.ElemOff.value = value
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
		Group: $.VarRef<Type | null>;
		Hasher: $.VarRef<((p0: Pointer, p1: uintptr) => uintptr) | null>;
		GroupSize: $.VarRef<uintptr>;
		SlotSize: $.VarRef<uintptr>;
		ElemOff: $.VarRef<uintptr>;
		Flags: $.VarRef<number>;
	}

	constructor(init?: Partial<{Elem?: Type | null, ElemOff?: uintptr, Flags?: number, Group?: Type | null, GroupSize?: uintptr, Hasher?: ((p0: Pointer, p1: uintptr) => uintptr) | null, Key?: Type | null, SlotSize?: uintptr, Type?: Partial<ConstructorParameters<typeof Type>[0]>}>) {
		this._fields = {
			Type: $.varRef(new Type(init?.Type)),
			Key: $.varRef(init?.Key ?? null),
			Elem: $.varRef(init?.Elem ?? null),
			Group: $.varRef(init?.Group ?? null),
			Hasher: $.varRef(init?.Hasher ?? null),
			GroupSize: $.varRef(init?.GroupSize ?? 0),
			SlotSize: $.varRef(init?.SlotSize ?? 0),
			ElemOff: $.varRef(init?.ElemOff ?? 0),
			Flags: $.varRef(init?.Flags ?? 0)
		}
	}

	public clone(): SwissMapType {
		const cloned = new SwissMapType()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value.clone()),
			Key: $.varRef(this._fields.Key.value),
			Elem: $.varRef(this._fields.Elem.value),
			Group: $.varRef(this._fields.Group.value),
			Hasher: $.varRef(this._fields.Hasher.value),
			GroupSize: $.varRef(this._fields.GroupSize.value),
			SlotSize: $.varRef(this._fields.SlotSize.value),
			ElemOff: $.varRef(this._fields.ElemOff.value),
			Flags: $.varRef(this._fields.Flags.value)
		}
		return cloned
	}

	public NeedKeyUpdate(): boolean {
		const mt = this
		return (mt!.Flags & 1) != 0
	}

	public HashMightPanic(): boolean {
		const mt = this
		return (mt!.Flags & 2) != 0
	}

	public IndirectKey(): boolean {
		const mt = this
		return (mt!.Flags & 4) != 0
	}

	public IndirectElem(): boolean {
		const mt = this
		return (mt!.Flags & 8) != 0
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
	  'SwissMapType',
	  new SwissMapType(),
	  [{ name: "NeedKeyUpdate", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "HashMightPanic", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "IndirectKey", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "IndirectElem", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  SwissMapType,
	  {"Type": "Type", "Key": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Elem": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Group": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Hasher": { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Basic, name: "Pointer" }, { kind: $.TypeKind.Basic, name: "uintptr" }], results: [{ kind: $.TypeKind.Basic, name: "uintptr" }] }, "GroupSize": { kind: $.TypeKind.Basic, name: "uintptr" }, "SlotSize": { kind: $.TypeKind.Basic, name: "uintptr" }, "ElemOff": { kind: $.TypeKind.Basic, name: "uintptr" }, "Flags": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export let SwissMapNeedKeyUpdate: number = (1 << 0)

export let SwissMapHashMightPanic: number = 0

export let SwissMapIndirectKey: number = 0

export let SwissMapIndirectElem: number = 0

