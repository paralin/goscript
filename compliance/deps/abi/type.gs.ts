import * as $ from "@goscript/builtin/builtin.js";
import { NoEscape } from "./escape.gs.js";

import * as unsafe from "@goscript/unsafe/index.js"

export class Type {
	public get Size_(): uintptr {
		return this._fields.Size_.value
	}
	public set Size_(value: uintptr) {
		this._fields.Size_.value = value
	}

	// number of (prefix) bytes in the type that can contain pointers
	public get PtrBytes(): uintptr {
		return this._fields.PtrBytes.value
	}
	public set PtrBytes(value: uintptr) {
		this._fields.PtrBytes.value = value
	}

	// hash of type; avoids computation in hash tables
	public get Hash(): number {
		return this._fields.Hash.value
	}
	public set Hash(value: number) {
		this._fields.Hash.value = value
	}

	// extra type information flags
	public get TFlag(): TFlag {
		return this._fields.TFlag.value
	}
	public set TFlag(value: TFlag) {
		this._fields.TFlag.value = value
	}

	// alignment of variable with this type
	public get Align_(): number {
		return this._fields.Align_.value
	}
	public set Align_(value: number) {
		this._fields.Align_.value = value
	}

	// alignment of struct field with this type
	public get FieldAlign_(): number {
		return this._fields.FieldAlign_.value
	}
	public set FieldAlign_(value: number) {
		this._fields.FieldAlign_.value = value
	}

	// enumeration for C
	public get Kind_(): Kind {
		return this._fields.Kind_.value
	}
	public set Kind_(value: Kind) {
		this._fields.Kind_.value = value
	}

	// function for comparing objects of this type
	// (ptr to object A, ptr to object B) -> ==?
	public get Equal(): ((p0: Pointer, p1: Pointer) => boolean) | null {
		return this._fields.Equal.value
	}
	public set Equal(value: ((p0: Pointer, p1: Pointer) => boolean) | null) {
		this._fields.Equal.value = value
	}

	// GCData stores the GC type data for the garbage collector.
	// Normally, GCData points to a bitmask that describes the
	// ptr/nonptr fields of the type. The bitmask will have at
	// least PtrBytes/ptrSize bits.
	// If the TFlagGCMaskOnDemand bit is set, GCData is instead a
	// **byte and the pointer to the bitmask is one dereference away.
	// The runtime will build the bitmask if needed.
	// (See runtime/type.go:getGCMask.)
	// Note: multiple types may have the same value of GCData,
	// including when TFlagGCMaskOnDemand is set. The types will, of course,
	// have the same pointer layout (but not necessarily the same size).
	public get GCData(): $.VarRef<number> | null {
		return this._fields.GCData.value
	}
	public set GCData(value: $.VarRef<number> | null) {
		this._fields.GCData.value = value
	}

	// string form
	public get Str(): NameOff {
		return this._fields.Str.value
	}
	public set Str(value: NameOff) {
		this._fields.Str.value = value
	}

	// type for pointer to this type, may be zero
	public get PtrToThis(): TypeOff {
		return this._fields.PtrToThis.value
	}
	public set PtrToThis(value: TypeOff) {
		this._fields.PtrToThis.value = value
	}

	public _fields: {
		Size_: $.VarRef<uintptr>;
		PtrBytes: $.VarRef<uintptr>;
		Hash: $.VarRef<number>;
		TFlag: $.VarRef<TFlag>;
		Align_: $.VarRef<number>;
		FieldAlign_: $.VarRef<number>;
		Kind_: $.VarRef<Kind>;
		Equal: $.VarRef<((p0: Pointer, p1: Pointer) => boolean) | null>;
		GCData: $.VarRef<$.VarRef<number> | null>;
		Str: $.VarRef<NameOff>;
		PtrToThis: $.VarRef<TypeOff>;
	}

	constructor(init?: Partial<{Align_?: number, Equal?: ((p0: Pointer, p1: Pointer) => boolean) | null, FieldAlign_?: number, GCData?: $.VarRef<number> | null, Hash?: number, Kind_?: Kind, PtrBytes?: uintptr, PtrToThis?: TypeOff, Size_?: uintptr, Str?: NameOff, TFlag?: TFlag}>) {
		this._fields = {
			Size_: $.varRef(init?.Size_ ?? 0),
			PtrBytes: $.varRef(init?.PtrBytes ?? 0),
			Hash: $.varRef(init?.Hash ?? 0),
			TFlag: $.varRef(init?.TFlag ?? 0),
			Align_: $.varRef(init?.Align_ ?? 0),
			FieldAlign_: $.varRef(init?.FieldAlign_ ?? 0),
			Kind_: $.varRef(init?.Kind_ ?? 0),
			Equal: $.varRef(init?.Equal ?? null),
			GCData: $.varRef(init?.GCData ?? null),
			Str: $.varRef(init?.Str ?? 0),
			PtrToThis: $.varRef(init?.PtrToThis ?? 0)
		}
	}

	public clone(): Type {
		const cloned = new Type()
		cloned._fields = {
			Size_: $.varRef(this._fields.Size_.value),
			PtrBytes: $.varRef(this._fields.PtrBytes.value),
			Hash: $.varRef(this._fields.Hash.value),
			TFlag: $.varRef(this._fields.TFlag.value),
			Align_: $.varRef(this._fields.Align_.value),
			FieldAlign_: $.varRef(this._fields.FieldAlign_.value),
			Kind_: $.varRef(this._fields.Kind_.value),
			Equal: $.varRef(this._fields.Equal.value),
			GCData: $.varRef(this._fields.GCData.value),
			Str: $.varRef(this._fields.Str.value),
			PtrToThis: $.varRef(this._fields.PtrToThis.value)
		}
		return cloned
	}

	public Kind(): Kind {
		const t = this
		return (t!.Kind_ & 31)
	}

	public HasName(): boolean {
		const t = this
		return (t!.TFlag & 4) != 0
	}

	// Pointers reports whether t contains pointers.
	public Pointers(): boolean {
		const t = this
		return t!.PtrBytes != 0
	}

	// IfaceIndir reports whether t is stored indirectly in an interface value.
	public IfaceIndir(): boolean {
		const t = this
		return (t!.Kind_ & 32) == 0
	}

	// isDirectIface reports whether t is stored directly in an interface value.
	public IsDirectIface(): boolean {
		const t = this
		return (t!.Kind_ & 32) != 0
	}

	public GcSlice(begin: uintptr, end: uintptr): Uint8Array {
		const t = this
		if ((t!.TFlag & 16) != 0) {
			$.panic("GcSlice can't handle on-demand gcdata types")
		}
		return unsafe.Slice(t!.GCData, (end as number)).subarray(begin)
	}

	// Len returns the length of t if t is an array type, otherwise 0
	public Len(): number {
		const t = this
		if (t!.Kind() == 17) {
			return ((ArrayType!)(unsafe.Pointer(t))!.Len as number)
		}
		return 0
	}

	public Common(): Type | null {
		const t = this
		return t
	}

	// ChanDir returns the direction of t if t is a channel type, otherwise InvalidDir (0).
	public ChanDir(): ChanDir {
		const t = this
		if (t!.Kind() == 18) {
			let ch = (ChanType!)(unsafe.Pointer(t))
			return ch!.Dir
		}
		return 0
	}

	// Uncommon returns a pointer to T's "uncommon" data if there is any, otherwise nil
	public Uncommon(): UncommonType | null {
		const t = this
		if ((t!.TFlag & 1) == 0) {
			return null
		}
		switch (t!.Kind()) {
			case 25:
				return (structTypeUncommon!)(unsafe.Pointer(t))!.u
				break
			case 22:
				class u {
					public get u(): UncommonType {
						return this._fields.u.value
					}
					public set u(value: UncommonType) {
						this._fields.u.value = value
					}

					public get PtrType(): PtrType {
						return this._fields.PtrType.value
					}
					public set PtrType(value: PtrType) {
						this._fields.PtrType.value = value
					}

					public _fields: {
						PtrType: $.VarRef<PtrType>;
						u: $.VarRef<UncommonType>;
					}

					constructor(init?: Partial<{PtrType?: Partial<ConstructorParameters<typeof PtrType>[0]>, u?: UncommonType}>) {
						this._fields = {
							PtrType: $.varRef(new PtrType(init?.PtrType)),
							u: $.varRef(init?.u?.clone() ?? new UncommonType())
						}
					}

					public clone(): u {
						const cloned = new u()
						cloned._fields = {
							PtrType: $.varRef(this._fields.PtrType.value.clone()),
							u: $.varRef(this._fields.u.value?.clone() ?? null)
						}
						return cloned
					}

					public get Type(): Type {
						return this.PtrType.Type
					}
					public set Type(value: Type) {
						this.PtrType.Type = value
					}

					public get Elem(): Type | null {
						return this.PtrType.Elem
					}
					public set Elem(value: Type | null) {
						this.PtrType.Elem = value
					}

					// Register this type with the runtime type system
					static __typeInfo = $.registerStructType(
					  'u',
					  new u(),
					  [],
					  u,
					  {"PtrType": "PtrType", "u": "UncommonType"}
					);
				}
				return (u!)(unsafe.Pointer(t))!.u
				break
			case 19:
				class u {
					public get u(): UncommonType {
						return this._fields.u.value
					}
					public set u(value: UncommonType) {
						this._fields.u.value = value
					}

					public get FuncType(): FuncType {
						return this._fields.FuncType.value
					}
					public set FuncType(value: FuncType) {
						this._fields.FuncType.value = value
					}

					public _fields: {
						FuncType: $.VarRef<FuncType>;
						u: $.VarRef<UncommonType>;
					}

					constructor(init?: Partial<{FuncType?: Partial<ConstructorParameters<typeof FuncType>[0]>, u?: UncommonType}>) {
						this._fields = {
							FuncType: $.varRef(new FuncType(init?.FuncType)),
							u: $.varRef(init?.u?.clone() ?? new UncommonType())
						}
					}

					public clone(): u {
						const cloned = new u()
						cloned._fields = {
							FuncType: $.varRef(this._fields.FuncType.value.clone()),
							u: $.varRef(this._fields.u.value?.clone() ?? null)
						}
						return cloned
					}

					public get Type(): Type {
						return this.FuncType.Type
					}
					public set Type(value: Type) {
						this.FuncType.Type = value
					}

					public get InCount(): number {
						return this.FuncType.InCount
					}
					public set InCount(value: number) {
						this.FuncType.InCount = value
					}

					public get OutCount(): number {
						return this.FuncType.OutCount
					}
					public set OutCount(value: number) {
						this.FuncType.OutCount = value
					}

					// Register this type with the runtime type system
					static __typeInfo = $.registerStructType(
					  'u',
					  new u(),
					  [],
					  u,
					  {"FuncType": "FuncType", "u": "UncommonType"}
					);
				}
				return (u!)(unsafe.Pointer(t))!.u
				break
			case 23:
				class u {
					public get u(): UncommonType {
						return this._fields.u.value
					}
					public set u(value: UncommonType) {
						this._fields.u.value = value
					}

					public get SliceType(): SliceType {
						return this._fields.SliceType.value
					}
					public set SliceType(value: SliceType) {
						this._fields.SliceType.value = value
					}

					public _fields: {
						SliceType: $.VarRef<SliceType>;
						u: $.VarRef<UncommonType>;
					}

					constructor(init?: Partial<{SliceType?: Partial<ConstructorParameters<typeof SliceType>[0]>, u?: UncommonType}>) {
						this._fields = {
							SliceType: $.varRef(new SliceType(init?.SliceType)),
							u: $.varRef(init?.u?.clone() ?? new UncommonType())
						}
					}

					public clone(): u {
						const cloned = new u()
						cloned._fields = {
							SliceType: $.varRef(this._fields.SliceType.value.clone()),
							u: $.varRef(this._fields.u.value?.clone() ?? null)
						}
						return cloned
					}

					public get Type(): Type {
						return this.SliceType.Type
					}
					public set Type(value: Type) {
						this.SliceType.Type = value
					}

					public get Elem(): Type | null {
						return this.SliceType.Elem
					}
					public set Elem(value: Type | null) {
						this.SliceType.Elem = value
					}

					// Register this type with the runtime type system
					static __typeInfo = $.registerStructType(
					  'u',
					  new u(),
					  [],
					  u,
					  {"SliceType": "SliceType", "u": "UncommonType"}
					);
				}
				return (u!)(unsafe.Pointer(t))!.u
				break
			case 17:
				class u {
					public get u(): UncommonType {
						return this._fields.u.value
					}
					public set u(value: UncommonType) {
						this._fields.u.value = value
					}

					public get ArrayType(): ArrayType {
						return this._fields.ArrayType.value
					}
					public set ArrayType(value: ArrayType) {
						this._fields.ArrayType.value = value
					}

					public _fields: {
						ArrayType: $.VarRef<ArrayType>;
						u: $.VarRef<UncommonType>;
					}

					constructor(init?: Partial<{ArrayType?: Partial<ConstructorParameters<typeof ArrayType>[0]>, u?: UncommonType}>) {
						this._fields = {
							ArrayType: $.varRef(new ArrayType(init?.ArrayType)),
							u: $.varRef(init?.u?.clone() ?? new UncommonType())
						}
					}

					public clone(): u {
						const cloned = new u()
						cloned._fields = {
							ArrayType: $.varRef(this._fields.ArrayType.value.clone()),
							u: $.varRef(this._fields.u.value?.clone() ?? null)
						}
						return cloned
					}

					public get Type(): Type {
						return this.ArrayType.Type
					}
					public set Type(value: Type) {
						this.ArrayType.Type = value
					}

					public get Elem(): Type | null {
						return this.ArrayType.Elem
					}
					public set Elem(value: Type | null) {
						this.ArrayType.Elem = value
					}

					public get Slice(): Type | null {
						return this.ArrayType.Slice
					}
					public set Slice(value: Type | null) {
						this.ArrayType.Slice = value
					}

					public get Len(): uintptr {
						return this.ArrayType.Len
					}
					public set Len(value: uintptr) {
						this.ArrayType.Len = value
					}

					// Register this type with the runtime type system
					static __typeInfo = $.registerStructType(
					  'u',
					  new u(),
					  [],
					  u,
					  {"ArrayType": "ArrayType", "u": "UncommonType"}
					);
				}
				return (u!)(unsafe.Pointer(t))!.u
				break
			case 18:
				class u {
					public get u(): UncommonType {
						return this._fields.u.value
					}
					public set u(value: UncommonType) {
						this._fields.u.value = value
					}

					public get ChanType(): ChanType {
						return this._fields.ChanType.value
					}
					public set ChanType(value: ChanType) {
						this._fields.ChanType.value = value
					}

					public _fields: {
						ChanType: $.VarRef<ChanType>;
						u: $.VarRef<UncommonType>;
					}

					constructor(init?: Partial<{ChanType?: Partial<ConstructorParameters<typeof ChanType>[0]>, u?: UncommonType}>) {
						this._fields = {
							ChanType: $.varRef(new ChanType(init?.ChanType)),
							u: $.varRef(init?.u?.clone() ?? new UncommonType())
						}
					}

					public clone(): u {
						const cloned = new u()
						cloned._fields = {
							ChanType: $.varRef(this._fields.ChanType.value.clone()),
							u: $.varRef(this._fields.u.value?.clone() ?? null)
						}
						return cloned
					}

					public get Type(): Type {
						return this.ChanType.Type
					}
					public set Type(value: Type) {
						this.ChanType.Type = value
					}

					public get Elem(): Type | null {
						return this.ChanType.Elem
					}
					public set Elem(value: Type | null) {
						this.ChanType.Elem = value
					}

					public get Dir(): ChanDir {
						return this.ChanType.Dir
					}
					public set Dir(value: ChanDir) {
						this.ChanType.Dir = value
					}

					// Register this type with the runtime type system
					static __typeInfo = $.registerStructType(
					  'u',
					  new u(),
					  [],
					  u,
					  {"ChanType": "ChanType", "u": "UncommonType"}
					);
				}
				return (u!)(unsafe.Pointer(t))!.u
				break
			case 21:
				class u {
					public get u(): UncommonType {
						return this._fields.u.value
					}
					public set u(value: UncommonType) {
						this._fields.u.value = value
					}

					public get MapType(): { Type?: Type; Key?: Type | null; Elem?: Type | null; Group?: Type | null; Hasher?: ((p0: Pointer, p1: uintptr) => uintptr) | null; GroupSize?: uintptr; SlotSize?: uintptr; ElemOff?: uintptr; Flags?: number } {
						return this._fields.MapType.value
					}
					public set MapType(value: { Type?: Type; Key?: Type | null; Elem?: Type | null; Group?: Type | null; Hasher?: ((p0: Pointer, p1: uintptr) => uintptr) | null; GroupSize?: uintptr; SlotSize?: uintptr; ElemOff?: uintptr; Flags?: number }) {
						this._fields.MapType.value = value
					}

					public _fields: {
						MapType: $.VarRef<{ Type?: Type; Key?: Type | null; Elem?: Type | null; Group?: Type | null; Hasher?: ((p0: Pointer, p1: uintptr) => uintptr) | null; GroupSize?: uintptr; SlotSize?: uintptr; ElemOff?: uintptr; Flags?: number }>;
						u: $.VarRef<UncommonType>;
					}

					constructor(init?: Partial<{u?: UncommonType}>) {
						this._fields = {
							MapType: $.varRef(new MapType(init?.MapType)),
							u: $.varRef(init?.u?.clone() ?? new UncommonType())
						}
					}

					public clone(): u {
						const cloned = new u()
						cloned._fields = {
							MapType: $.varRef(this._fields.MapType.value),
							u: $.varRef(this._fields.u.value?.clone() ?? null)
						}
						return cloned
					}

					// Register this type with the runtime type system
					static __typeInfo = $.registerStructType(
					  'u',
					  new u(),
					  [],
					  u,
					  {"MapType": { kind: $.TypeKind.Struct, fields: {"Type": "Type", "Key": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Elem": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Group": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Hasher": { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Basic, name: "Pointer" }, { kind: $.TypeKind.Basic, name: "uintptr" }], results: [{ kind: $.TypeKind.Basic, name: "uintptr" }] }, "GroupSize": { kind: $.TypeKind.Basic, name: "uintptr" }, "SlotSize": { kind: $.TypeKind.Basic, name: "uintptr" }, "ElemOff": { kind: $.TypeKind.Basic, name: "uintptr" }, "Flags": { kind: $.TypeKind.Basic, name: "number" }}, methods: [] }, "u": "UncommonType"}
					);
				}
				return (u!)(unsafe.Pointer(t))!.u
				break
			case 20:
				class u {
					public get u(): UncommonType {
						return this._fields.u.value
					}
					public set u(value: UncommonType) {
						this._fields.u.value = value
					}

					public get InterfaceType(): InterfaceType {
						return this._fields.InterfaceType.value
					}
					public set InterfaceType(value: InterfaceType) {
						this._fields.InterfaceType.value = value
					}

					public _fields: {
						InterfaceType: $.VarRef<InterfaceType>;
						u: $.VarRef<UncommonType>;
					}

					constructor(init?: Partial<{InterfaceType?: Partial<ConstructorParameters<typeof InterfaceType>[0]>, u?: UncommonType}>) {
						this._fields = {
							InterfaceType: $.varRef(new InterfaceType(init?.InterfaceType)),
							u: $.varRef(init?.u?.clone() ?? new UncommonType())
						}
					}

					public clone(): u {
						const cloned = new u()
						cloned._fields = {
							InterfaceType: $.varRef(this._fields.InterfaceType.value.clone()),
							u: $.varRef(this._fields.u.value?.clone() ?? null)
						}
						return cloned
					}

					public get Type(): Type {
						return this.InterfaceType.Type
					}
					public set Type(value: Type) {
						this.InterfaceType.Type = value
					}

					public get PkgPath(): Name {
						return this.InterfaceType.PkgPath
					}
					public set PkgPath(value: Name) {
						this.InterfaceType.PkgPath = value
					}

					public get Methods(): $.Slice<Imethod> {
						return this.InterfaceType.Methods
					}
					public set Methods(value: $.Slice<Imethod>) {
						this.InterfaceType.Methods = value
					}

					// Register this type with the runtime type system
					static __typeInfo = $.registerStructType(
					  'u',
					  new u(),
					  [],
					  u,
					  {"InterfaceType": "InterfaceType", "u": "UncommonType"}
					);
				}
				return (u!)(unsafe.Pointer(t))!.u
				break
			default:
				class u {
					public get u(): UncommonType {
						return this._fields.u.value
					}
					public set u(value: UncommonType) {
						this._fields.u.value = value
					}

					public get Type(): Type {
						return this._fields.Type.value
					}
					public set Type(value: Type) {
						this._fields.Type.value = value
					}

					public _fields: {
						Type: $.VarRef<Type>;
						u: $.VarRef<UncommonType>;
					}

					constructor(init?: Partial<{Type?: Partial<ConstructorParameters<typeof Type>[0]>, u?: UncommonType}>) {
						this._fields = {
							Type: $.varRef(new Type(init?.Type)),
							u: $.varRef(init?.u?.clone() ?? new UncommonType())
						}
					}

					public clone(): u {
						const cloned = new u()
						cloned._fields = {
							Type: $.varRef(this._fields.Type.value.clone()),
							u: $.varRef(this._fields.u.value?.clone() ?? null)
						}
						return cloned
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
					  'u',
					  new u(),
					  [],
					  u,
					  {"Type": "Type", "u": "UncommonType"}
					);
				}
				return (u!)(unsafe.Pointer(t))!.u
				break
		}
	}

	// Elem returns the element type for t if t is an array, channel, map, pointer, or slice, otherwise nil.
	public Elem(): Type | null {
		const t = this
		switch (t!.Kind()) {
			case 17:
				let tt = (ArrayType!)(unsafe.Pointer(t))
				return tt!.Elem
				break
			case 18:
				let tt = (ChanType!)(unsafe.Pointer(t))
				return tt!.Elem
				break
			case 21:
				let tt = (mapType!)(unsafe.Pointer(t))
				return tt!.Elem
				break
			case 22:
				let tt = (PtrType!)(unsafe.Pointer(t))
				return tt!.Elem
				break
			case 23:
				let tt = (SliceType!)(unsafe.Pointer(t))
				return tt!.Elem
				break
		}
		return null
	}

	// StructType returns t cast to a *StructType, or nil if its tag does not match.
	public StructType(): StructType | null {
		const t = this
		if (t!.Kind() != 25) {
			return null
		}
		return (StructType!)(unsafe.Pointer(t))
	}

	// MapType returns t cast to a *OldMapType or *SwissMapType, or nil if its tag does not match.
	public MapType(): { Type?: Type; Key?: Type | null; Elem?: Type | null; Group?: Type | null; Hasher?: ((p0: Pointer, p1: uintptr) => uintptr) | null; GroupSize?: uintptr; SlotSize?: uintptr; ElemOff?: uintptr; Flags?: number } | null {
		const t = this
		if (t!.Kind() != 21) {
			return null
		}
		return (mapType!)(unsafe.Pointer(t))
	}

	// ArrayType returns t cast to a *ArrayType, or nil if its tag does not match.
	public ArrayType(): ArrayType | null {
		const t = this
		if (t!.Kind() != 17) {
			return null
		}
		return (ArrayType!)(unsafe.Pointer(t))
	}

	// FuncType returns t cast to a *FuncType, or nil if its tag does not match.
	public FuncType(): FuncType | null {
		const t = this
		if (t!.Kind() != 19) {
			return null
		}
		return (FuncType!)(unsafe.Pointer(t))
	}

	// InterfaceType returns t cast to a *InterfaceType, or nil if its tag does not match.
	public InterfaceType(): InterfaceType | null {
		const t = this
		if (t!.Kind() != 20) {
			return null
		}
		return (InterfaceType!)(unsafe.Pointer(t))
	}

	// Size returns the size of data with type t.
	public Size(): uintptr {
		const t = this
		return t!.Size_
	}

	// Align returns the alignment of data with type t.
	public Align(): number {
		const t = this
		return (t!.Align_ as number)
	}

	public FieldAlign(): number {
		const t = this
		return (t!.FieldAlign_ as number)
	}

	public ExportedMethods(): $.Slice<Method> {
		const t = this
		let ut = t!.Uncommon()
		if (ut == null) {
			return null
		}
		return ut!.ExportedMethods()
	}

	public NumMethod(): number {
		const t = this
		if (t!.Kind() == 20) {
			let tt = (InterfaceType!)(unsafe.Pointer(t))
			return tt!.NumMethod()
		}
		return $.len(t!.ExportedMethods())
	}

	public Key(): Type | null {
		const t = this
		if (t!.Kind() == 21) {
			return (mapType!)(unsafe.Pointer(t))!.Key
		}
		return null
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Type',
	  new Type(),
	  [{ name: "Kind", args: [], returns: [{ type: "Kind" }] }, { name: "HasName", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Pointers", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "IfaceIndir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "IsDirectIface", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "GcSlice", args: [{ name: "begin", type: { kind: $.TypeKind.Basic, name: "uintptr" } }, { name: "end", type: { kind: $.TypeKind.Basic, name: "uintptr" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "Len", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Common", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Type" } }] }, { name: "ChanDir", args: [], returns: [{ type: "ChanDir" }] }, { name: "Uncommon", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "UncommonType" } }] }, { name: "Elem", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Type" } }] }, { name: "StructType", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "StructType" } }] }, { name: "MapType", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Struct, fields: {"Type": "Type", "Key": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Elem": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Group": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Hasher": { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Basic, name: "Pointer" }, { kind: $.TypeKind.Basic, name: "uintptr" }], results: [{ kind: $.TypeKind.Basic, name: "uintptr" }] }, "GroupSize": { kind: $.TypeKind.Basic, name: "uintptr" }, "SlotSize": { kind: $.TypeKind.Basic, name: "uintptr" }, "ElemOff": { kind: $.TypeKind.Basic, name: "uintptr" }, "Flags": { kind: $.TypeKind.Basic, name: "number" }}, methods: [] } } }] }, { name: "ArrayType", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "ArrayType" } }] }, { name: "FuncType", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "FuncType" } }] }, { name: "InterfaceType", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "InterfaceType" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "uintptr" } }] }, { name: "Align", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "FieldAlign", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "ExportedMethods", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: "Method" } }] }, { name: "NumMethod", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Key", args: [], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Type" } }] }],
	  Type,
	  {"Size_": { kind: $.TypeKind.Basic, name: "uintptr" }, "PtrBytes": { kind: $.TypeKind.Basic, name: "uintptr" }, "Hash": { kind: $.TypeKind.Basic, name: "number" }, "TFlag": "TFlag", "Align_": { kind: $.TypeKind.Basic, name: "number" }, "FieldAlign_": { kind: $.TypeKind.Basic, name: "number" }, "Kind_": "Kind", "Equal": { kind: $.TypeKind.Function, params: [{ kind: $.TypeKind.Basic, name: "Pointer" }, { kind: $.TypeKind.Basic, name: "Pointer" }], results: [{ kind: $.TypeKind.Basic, name: "boolean" }] }, "GCData": { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "Str": "NameOff", "PtrToThis": "TypeOff"}
	);
}

export type Kind = number;

export let Invalid: Kind = 0

export let Bool: Kind = 0

export let Int: Kind = 0

export let Int8: Kind = 0

export let Int16: Kind = 0

export let Int32: Kind = 0

export let Int64: Kind = 0

export let Uint: Kind = 0

export let Uint8: Kind = 0

export let Uint16: Kind = 0

export let Uint32: Kind = 0

export let Uint64: Kind = 0

export let Uintptr: Kind = 0

export let Float32: Kind = 0

export let Float64: Kind = 0

export let Complex64: Kind = 0

export let Complex128: Kind = 0

export let Array: Kind = 0

export let Chan: Kind = 0

export let Func: Kind = 0

export let Interface: Kind = 0

export let Map: Kind = 0

export let Pointer: Kind = 0

export let Slice: Kind = 0

export let String: Kind = 0

export let Struct: Kind = 0

export let UnsafePointer: Kind = 0

// TODO (khr, drchase) why aren't these in TFlag?  Investigate, fix if possible.
export let KindDirectIface: Kind = (1 << 5)

export let KindMask: Kind = ((1 << 5)) - 1

export type TFlag = number;

// TFlagUncommon means that there is a data with a type, UncommonType,
// just beyond the shared-per-type common data.  That is, the data
// for struct types will store their UncommonType at one offset, the
// data for interface types will store their UncommonType at a different
// offset.  UncommonType is always accessed via a pointer that is computed
// using trust-us-we-are-the-implementors pointer arithmetic.
//
// For example, if t.Kind() == Struct and t.tflag&TFlagUncommon != 0,
// then t has UncommonType data and it can be accessed as:
//
//	type structTypeUncommon struct {
//		structType
//		u UncommonType
//	}
//	u := &(*structTypeUncommon)(unsafe.Pointer(t)).u
export let TFlagUncommon: TFlag = (1 << 0)

// TFlagExtraStar means the name in the str field has an
// extraneous '*' prefix. This is because for most types T in
// a program, the type *T also exists and reusing the str data
// saves binary size.
export let TFlagExtraStar: TFlag = (1 << 1)

// TFlagNamed means the type has a name.
export let TFlagNamed: TFlag = (1 << 2)

// TFlagRegularMemory means that equal and hash functions can treat
// this type as a single region of t.size bytes.
export let TFlagRegularMemory: TFlag = (1 << 3)

// TFlagGCMaskOnDemand means that the GC pointer bitmask will be
// computed on demand at runtime instead of being precomputed at
// compile time. If this flag is set, the GCData field effectively
// has type **byte instead of *byte. The runtime will store a
// pointer to the GC pointer bitmask in *GCData.
export let TFlagGCMaskOnDemand: TFlag = (1 << 4)

export type NameOff = number;

export type TypeOff = number;

export type TextOff = number;

let kindNames = $.arrayToSlice<string>([/* unhandled keyed array literal key type */0: "invalid"/* unhandled keyed array literal key type */1: "bool"/* unhandled keyed array literal key type */2: "int"/* unhandled keyed array literal key type */3: "int8"/* unhandled keyed array literal key type */4: "int16"/* unhandled keyed array literal key type */5: "int32"/* unhandled keyed array literal key type */6: "int64"/* unhandled keyed array literal key type */7: "uint"/* unhandled keyed array literal key type */8: "uint8"/* unhandled keyed array literal key type */9: "uint16"/* unhandled keyed array literal key type */10: "uint32"/* unhandled keyed array literal key type */11: "uint64"/* unhandled keyed array literal key type */12: "uintptr"/* unhandled keyed array literal key type */13: "float32"/* unhandled keyed array literal key type */14: "float64"/* unhandled keyed array literal key type */15: "complex64"/* unhandled keyed array literal key type */16: "complex128"/* unhandled keyed array literal key type */17: "array"/* unhandled keyed array literal key type */18: "chan"/* unhandled keyed array literal key type */19: "func"/* unhandled keyed array literal key type */20: "interface"/* unhandled keyed array literal key type */21: "map"/* unhandled keyed array literal key type */22: "ptr"/* unhandled keyed array literal key type */23: "slice"/* unhandled keyed array literal key type */24: "string"/* unhandled keyed array literal key type */25: "struct"/* unhandled keyed array literal key type */26: "unsafe.Pointer"null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null])

// TypeOf returns the abi.Type of some value.
export function TypeOf(a: null | any): Type | null {
	let eface = (EmptyInterface!)(unsafe.Pointer(a))!.clone()
	// Types are either static (for compiler-created types) or
	// heap-allocated but always reachable (for reflection-created
	// types, held in the central map). So there is no need to
	// escape types. noescape here help avoid unnecessary escape
	// of v.
	return (Type!)(NoEscape(unsafe.Pointer(eface.Type)))
}

// TypeFor returns the abi.Type for a type parameter.
export function TypeFor<T extends any>(): Type | null {
	let v: T = null!

	// optimize for T being a non-interface kind
	{
		let t = TypeOf(v)
		if (t != null) {
			return t
		}
	}
	return TypeOf(null)!.Elem()
}

export class Method {
	// name of method
	public get Name(): NameOff {
		return this._fields.Name.value
	}
	public set Name(value: NameOff) {
		this._fields.Name.value = value
	}

	// method type (without receiver)
	public get Mtyp(): TypeOff {
		return this._fields.Mtyp.value
	}
	public set Mtyp(value: TypeOff) {
		this._fields.Mtyp.value = value
	}

	// fn used in interface call (one-word receiver)
	public get Ifn(): TextOff {
		return this._fields.Ifn.value
	}
	public set Ifn(value: TextOff) {
		this._fields.Ifn.value = value
	}

	// fn used for normal method call
	public get Tfn(): TextOff {
		return this._fields.Tfn.value
	}
	public set Tfn(value: TextOff) {
		this._fields.Tfn.value = value
	}

	public _fields: {
		Name: $.VarRef<NameOff>;
		Mtyp: $.VarRef<TypeOff>;
		Ifn: $.VarRef<TextOff>;
		Tfn: $.VarRef<TextOff>;
	}

	constructor(init?: Partial<{Ifn?: TextOff, Mtyp?: TypeOff, Name?: NameOff, Tfn?: TextOff}>) {
		this._fields = {
			Name: $.varRef(init?.Name ?? 0),
			Mtyp: $.varRef(init?.Mtyp ?? 0),
			Ifn: $.varRef(init?.Ifn ?? 0),
			Tfn: $.varRef(init?.Tfn ?? 0)
		}
	}

	public clone(): Method {
		const cloned = new Method()
		cloned._fields = {
			Name: $.varRef(this._fields.Name.value),
			Mtyp: $.varRef(this._fields.Mtyp.value),
			Ifn: $.varRef(this._fields.Ifn.value),
			Tfn: $.varRef(this._fields.Tfn.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Method',
	  new Method(),
	  [],
	  Method,
	  {"Name": "NameOff", "Mtyp": "TypeOff", "Ifn": "TextOff", "Tfn": "TextOff"}
	);
}

export class UncommonType {
	// import path; empty for built-in types like int, string
	public get PkgPath(): NameOff {
		return this._fields.PkgPath.value
	}
	public set PkgPath(value: NameOff) {
		this._fields.PkgPath.value = value
	}

	// number of methods
	public get Mcount(): number {
		return this._fields.Mcount.value
	}
	public set Mcount(value: number) {
		this._fields.Mcount.value = value
	}

	// number of exported methods
	public get Xcount(): number {
		return this._fields.Xcount.value
	}
	public set Xcount(value: number) {
		this._fields.Xcount.value = value
	}

	// offset from this uncommontype to [mcount]Method
	public get Moff(): number {
		return this._fields.Moff.value
	}
	public set Moff(value: number) {
		this._fields.Moff.value = value
	}

	// unused
	public get _(): number {
		return this._fields._.value
	}
	public set _(value: number) {
		this._fields._.value = value
	}

	public _fields: {
		PkgPath: $.VarRef<NameOff>;
		Mcount: $.VarRef<number>;
		Xcount: $.VarRef<number>;
		Moff: $.VarRef<number>;
		_: $.VarRef<number>;
	}

	constructor(init?: Partial<{Mcount?: number, Moff?: number, PkgPath?: NameOff, Xcount?: number, _?: number}>) {
		this._fields = {
			PkgPath: $.varRef(init?.PkgPath ?? 0),
			Mcount: $.varRef(init?.Mcount ?? 0),
			Xcount: $.varRef(init?.Xcount ?? 0),
			Moff: $.varRef(init?.Moff ?? 0),
			_: $.varRef(init?._ ?? 0)
		}
	}

	public clone(): UncommonType {
		const cloned = new UncommonType()
		cloned._fields = {
			PkgPath: $.varRef(this._fields.PkgPath.value),
			Mcount: $.varRef(this._fields.Mcount.value),
			Xcount: $.varRef(this._fields.Xcount.value),
			Moff: $.varRef(this._fields.Moff.value),
			_: $.varRef(this._fields._.value)
		}
		return cloned
	}

	public Methods(): $.Slice<Method> {
		const t = this
		if (t!.Mcount == 0) {
			return null
		}
		return $.goSlice((// unhandled value expr: *ast.ArrayType
		!)(addChecked(unsafe.Pointer(t), (t!.Moff as uintptr), "t.mcount > 0")), undefined, t!.Mcount, t!.Mcount)
	}

	public ExportedMethods(): $.Slice<Method> {
		const t = this
		if (t!.Xcount == 0) {
			return null
		}
		return $.goSlice((// unhandled value expr: *ast.ArrayType
		!)(addChecked(unsafe.Pointer(t), (t!.Moff as uintptr), "t.xcount > 0")), undefined, t!.Xcount, t!.Xcount)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'UncommonType',
	  new UncommonType(),
	  [{ name: "Methods", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: "Method" } }] }, { name: "ExportedMethods", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: "Method" } }] }],
	  UncommonType,
	  {"PkgPath": "NameOff", "Mcount": { kind: $.TypeKind.Basic, name: "number" }, "Xcount": { kind: $.TypeKind.Basic, name: "number" }, "Moff": { kind: $.TypeKind.Basic, name: "number" }, "_": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

// addChecked returns p+x.
//
// The whySafe string is ignored, so that the function still inlines
// as efficiently as p+x, but all call sites should use the string to
// record why the addition is safe, which is to say why the addition
// does not cause x to advance to the very end of p's allocation
// and therefore point incorrectly at the next block in memory.
export function addChecked(p: Pointer, x: uintptr, whySafe: string): Pointer {
	return unsafe.Pointer((p as uintptr) + x)
}

export class Imethod {
	// name of method
	public get Name(): NameOff {
		return this._fields.Name.value
	}
	public set Name(value: NameOff) {
		this._fields.Name.value = value
	}

	// .(*FuncType) underneath
	public get Typ(): TypeOff {
		return this._fields.Typ.value
	}
	public set Typ(value: TypeOff) {
		this._fields.Typ.value = value
	}

	public _fields: {
		Name: $.VarRef<NameOff>;
		Typ: $.VarRef<TypeOff>;
	}

	constructor(init?: Partial<{Name?: NameOff, Typ?: TypeOff}>) {
		this._fields = {
			Name: $.varRef(init?.Name ?? 0),
			Typ: $.varRef(init?.Typ ?? 0)
		}
	}

	public clone(): Imethod {
		const cloned = new Imethod()
		cloned._fields = {
			Name: $.varRef(this._fields.Name.value),
			Typ: $.varRef(this._fields.Typ.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Imethod',
	  new Imethod(),
	  [],
	  Imethod,
	  {"Name": "NameOff", "Typ": "TypeOff"}
	);
}

export class ArrayType {
	// array element type
	public get Elem(): Type | null {
		return this._fields.Elem.value
	}
	public set Elem(value: Type | null) {
		this._fields.Elem.value = value
	}

	// slice type
	public get Slice(): Type | null {
		return this._fields.Slice.value
	}
	public set Slice(value: Type | null) {
		this._fields.Slice.value = value
	}

	public get Len(): uintptr {
		return this._fields.Len.value
	}
	public set Len(value: uintptr) {
		this._fields.Len.value = value
	}

	public get Type(): Type {
		return this._fields.Type.value
	}
	public set Type(value: Type) {
		this._fields.Type.value = value
	}

	public _fields: {
		Type: $.VarRef<Type>;
		Elem: $.VarRef<Type | null>;
		Slice: $.VarRef<Type | null>;
		Len: $.VarRef<uintptr>;
	}

	constructor(init?: Partial<{Elem?: Type | null, Len?: uintptr, Slice?: Type | null, Type?: Partial<ConstructorParameters<typeof Type>[0]>}>) {
		this._fields = {
			Type: $.varRef(new Type(init?.Type)),
			Elem: $.varRef(init?.Elem ?? null),
			Slice: $.varRef(init?.Slice ?? null),
			Len: $.varRef(init?.Len ?? 0)
		}
	}

	public clone(): ArrayType {
		const cloned = new ArrayType()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value.clone()),
			Elem: $.varRef(this._fields.Elem.value),
			Slice: $.varRef(this._fields.Slice.value),
			Len: $.varRef(this._fields.Len.value)
		}
		return cloned
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
	  'ArrayType',
	  new ArrayType(),
	  [],
	  ArrayType,
	  {"Type": "Type", "Elem": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Slice": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Len": { kind: $.TypeKind.Basic, name: "uintptr" }}
	);
}

export type ChanDir = number;

// <-chan
export let RecvDir: ChanDir = (1 << 0)

// chan<-
export let SendDir: ChanDir = 0

// chan
export let BothDir: ChanDir = (1 | 2)

export let InvalidDir: ChanDir = 0

export class ChanType {
	public get Elem(): Type | null {
		return this._fields.Elem.value
	}
	public set Elem(value: Type | null) {
		this._fields.Elem.value = value
	}

	public get Dir(): ChanDir {
		return this._fields.Dir.value
	}
	public set Dir(value: ChanDir) {
		this._fields.Dir.value = value
	}

	public get Type(): Type {
		return this._fields.Type.value
	}
	public set Type(value: Type) {
		this._fields.Type.value = value
	}

	public _fields: {
		Type: $.VarRef<Type>;
		Elem: $.VarRef<Type | null>;
		Dir: $.VarRef<ChanDir>;
	}

	constructor(init?: Partial<{Dir?: ChanDir, Elem?: Type | null, Type?: Partial<ConstructorParameters<typeof Type>[0]>}>) {
		this._fields = {
			Type: $.varRef(new Type(init?.Type)),
			Elem: $.varRef(init?.Elem ?? null),
			Dir: $.varRef(init?.Dir ?? 0)
		}
	}

	public clone(): ChanType {
		const cloned = new ChanType()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value.clone()),
			Elem: $.varRef(this._fields.Elem.value),
			Dir: $.varRef(this._fields.Dir.value)
		}
		return cloned
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
	  'ChanType',
	  new ChanType(),
	  [],
	  ChanType,
	  {"Type": "Type", "Elem": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Dir": "ChanDir"}
	);
}

class structTypeUncommon {
	public get u(): UncommonType {
		return this._fields.u.value
	}
	public set u(value: UncommonType) {
		this._fields.u.value = value
	}

	public get StructType(): StructType {
		return this._fields.StructType.value
	}
	public set StructType(value: StructType) {
		this._fields.StructType.value = value
	}

	public _fields: {
		StructType: $.VarRef<StructType>;
		u: $.VarRef<UncommonType>;
	}

	constructor(init?: Partial<{StructType?: Partial<ConstructorParameters<typeof StructType>[0]>, u?: UncommonType}>) {
		this._fields = {
			StructType: $.varRef(new StructType(init?.StructType)),
			u: $.varRef(init?.u?.clone() ?? new UncommonType())
		}
	}

	public clone(): structTypeUncommon {
		const cloned = new structTypeUncommon()
		cloned._fields = {
			StructType: $.varRef(this._fields.StructType.value.clone()),
			u: $.varRef(this._fields.u.value?.clone() ?? null)
		}
		return cloned
	}

	public get Type(): Type {
		return this.StructType.Type
	}
	public set Type(value: Type) {
		this.StructType.Type = value
	}

	public get PkgPath(): Name {
		return this.StructType.PkgPath
	}
	public set PkgPath(value: Name) {
		this.StructType.PkgPath = value
	}

	public get Fields(): $.Slice<StructField> {
		return this.StructType.Fields
	}
	public set Fields(value: $.Slice<StructField>) {
		this.StructType.Fields = value
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'structTypeUncommon',
	  new structTypeUncommon(),
	  [],
	  structTypeUncommon,
	  {"StructType": "StructType", "u": "UncommonType"}
	);
}

export class InterfaceType {
	// import path
	public get PkgPath(): Name {
		return this._fields.PkgPath.value
	}
	public set PkgPath(value: Name) {
		this._fields.PkgPath.value = value
	}

	// sorted by hash
	public get Methods(): $.Slice<Imethod> {
		return this._fields.Methods.value
	}
	public set Methods(value: $.Slice<Imethod>) {
		this._fields.Methods.value = value
	}

	public get Type(): Type {
		return this._fields.Type.value
	}
	public set Type(value: Type) {
		this._fields.Type.value = value
	}

	public _fields: {
		Type: $.VarRef<Type>;
		PkgPath: $.VarRef<Name>;
		Methods: $.VarRef<$.Slice<Imethod>>;
	}

	constructor(init?: Partial<{Methods?: $.Slice<Imethod>, PkgPath?: Name, Type?: Partial<ConstructorParameters<typeof Type>[0]>}>) {
		this._fields = {
			Type: $.varRef(new Type(init?.Type)),
			PkgPath: $.varRef(init?.PkgPath?.clone() ?? new Name()),
			Methods: $.varRef(init?.Methods ?? null)
		}
	}

	public clone(): InterfaceType {
		const cloned = new InterfaceType()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value.clone()),
			PkgPath: $.varRef(this._fields.PkgPath.value?.clone() ?? null),
			Methods: $.varRef(this._fields.Methods.value)
		}
		return cloned
	}

	// NumMethod returns the number of interface methods in the type's method set.
	public NumMethod(): number {
		const t = this
		return $.len(t!.Methods)
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
	  'InterfaceType',
	  new InterfaceType(),
	  [{ name: "NumMethod", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  InterfaceType,
	  {"Type": "Type", "PkgPath": "Name", "Methods": { kind: $.TypeKind.Slice, elemType: "Imethod" }}
	);
}

export class SliceType {
	// slice element type
	public get Elem(): Type | null {
		return this._fields.Elem.value
	}
	public set Elem(value: Type | null) {
		this._fields.Elem.value = value
	}

	public get Type(): Type {
		return this._fields.Type.value
	}
	public set Type(value: Type) {
		this._fields.Type.value = value
	}

	public _fields: {
		Type: $.VarRef<Type>;
		Elem: $.VarRef<Type | null>;
	}

	constructor(init?: Partial<{Elem?: Type | null, Type?: Partial<ConstructorParameters<typeof Type>[0]>}>) {
		this._fields = {
			Type: $.varRef(new Type(init?.Type)),
			Elem: $.varRef(init?.Elem ?? null)
		}
	}

	public clone(): SliceType {
		const cloned = new SliceType()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value.clone()),
			Elem: $.varRef(this._fields.Elem.value)
		}
		return cloned
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
	  'SliceType',
	  new SliceType(),
	  [],
	  SliceType,
	  {"Type": "Type", "Elem": { kind: $.TypeKind.Pointer, elemType: "Type" }}
	);
}

export class FuncType {
	public get InCount(): number {
		return this._fields.InCount.value
	}
	public set InCount(value: number) {
		this._fields.InCount.value = value
	}

	// top bit is set if last input parameter is ...
	public get OutCount(): number {
		return this._fields.OutCount.value
	}
	public set OutCount(value: number) {
		this._fields.OutCount.value = value
	}

	public get Type(): Type {
		return this._fields.Type.value
	}
	public set Type(value: Type) {
		this._fields.Type.value = value
	}

	public _fields: {
		Type: $.VarRef<Type>;
		InCount: $.VarRef<number>;
		OutCount: $.VarRef<number>;
	}

	constructor(init?: Partial<{InCount?: number, OutCount?: number, Type?: Partial<ConstructorParameters<typeof Type>[0]>}>) {
		this._fields = {
			Type: $.varRef(new Type(init?.Type)),
			InCount: $.varRef(init?.InCount ?? 0),
			OutCount: $.varRef(init?.OutCount ?? 0)
		}
	}

	public clone(): FuncType {
		const cloned = new FuncType()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value.clone()),
			InCount: $.varRef(this._fields.InCount.value),
			OutCount: $.varRef(this._fields.OutCount.value)
		}
		return cloned
	}

	public In(i: number): Type | null {
		const t = this
		return t!.InSlice()![i]
	}

	public NumIn(): number {
		const t = this
		return (t!.InCount as number)
	}

	public NumOut(): number {
		const t = this
		return ((t!.OutCount & ((1 << 15) - 1)) as number)
	}

	public Out(i: number): Type | null {
		const t = this
		return (t!.OutSlice()![i])
	}

	public InSlice(): $.Slice<Type | null> {
		const t = this
		let uadd = unsafe.Sizeof(t!)
		if ((t!.TFlag & 1) != 0) {
			uadd += unsafe.Sizeof(new UncommonType({}))
		}
		if (t!.InCount == 0) {
			return null
		}
		return $.goSlice((// unhandled value expr: *ast.ArrayType
		!)(addChecked(unsafe.Pointer(t), uadd, "t.inCount > 0")), undefined, t!.InCount, t!.InCount)
	}

	public OutSlice(): $.Slice<Type | null> {
		const t = this
		let outCount = (t!.NumOut() as number)
		if (outCount == 0) {
			return null
		}
		let uadd = unsafe.Sizeof(t!)
		if ((t!.TFlag & 1) != 0) {
			uadd += unsafe.Sizeof(new UncommonType({}))
		}
		return $.goSlice((// unhandled value expr: *ast.ArrayType
		!)(addChecked(unsafe.Pointer(t), uadd, "outCount > 0")), t!.InCount, t!.InCount + outCount, t!.InCount + outCount)
	}

	public IsVariadic(): boolean {
		const t = this
		return (t!.OutCount & ((1 << 15))) != 0
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
	  'FuncType',
	  new FuncType(),
	  [{ name: "In", args: [{ name: "i", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Type" } }] }, { name: "NumIn", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "NumOut", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Out", args: [{ name: "i", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: "Type" } }] }, { name: "InSlice", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Pointer, elemType: "Type" } } }] }, { name: "OutSlice", args: [], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Pointer, elemType: "Type" } } }] }, { name: "IsVariadic", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  FuncType,
	  {"Type": "Type", "InCount": { kind: $.TypeKind.Basic, name: "number" }, "OutCount": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export class PtrType {
	// pointer element (pointed at) type
	public get Elem(): Type | null {
		return this._fields.Elem.value
	}
	public set Elem(value: Type | null) {
		this._fields.Elem.value = value
	}

	public get Type(): Type {
		return this._fields.Type.value
	}
	public set Type(value: Type) {
		this._fields.Type.value = value
	}

	public _fields: {
		Type: $.VarRef<Type>;
		Elem: $.VarRef<Type | null>;
	}

	constructor(init?: Partial<{Elem?: Type | null, Type?: Partial<ConstructorParameters<typeof Type>[0]>}>) {
		this._fields = {
			Type: $.varRef(new Type(init?.Type)),
			Elem: $.varRef(init?.Elem ?? null)
		}
	}

	public clone(): PtrType {
		const cloned = new PtrType()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value.clone()),
			Elem: $.varRef(this._fields.Elem.value)
		}
		return cloned
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
	  'PtrType',
	  new PtrType(),
	  [],
	  PtrType,
	  {"Type": "Type", "Elem": { kind: $.TypeKind.Pointer, elemType: "Type" }}
	);
}

export class StructField {
	// name is always non-empty
	public get Name(): Name {
		return this._fields.Name.value
	}
	public set Name(value: Name) {
		this._fields.Name.value = value
	}

	// type of field
	public get Typ(): Type | null {
		return this._fields.Typ.value
	}
	public set Typ(value: Type | null) {
		this._fields.Typ.value = value
	}

	// byte offset of field
	public get Offset(): uintptr {
		return this._fields.Offset.value
	}
	public set Offset(value: uintptr) {
		this._fields.Offset.value = value
	}

	public _fields: {
		Name: $.VarRef<Name>;
		Typ: $.VarRef<Type | null>;
		Offset: $.VarRef<uintptr>;
	}

	constructor(init?: Partial<{Name?: Name, Offset?: uintptr, Typ?: Type | null}>) {
		this._fields = {
			Name: $.varRef(init?.Name?.clone() ?? new Name()),
			Typ: $.varRef(init?.Typ ?? null),
			Offset: $.varRef(init?.Offset ?? 0)
		}
	}

	public clone(): StructField {
		const cloned = new StructField()
		cloned._fields = {
			Name: $.varRef(this._fields.Name.value?.clone() ?? null),
			Typ: $.varRef(this._fields.Typ.value),
			Offset: $.varRef(this._fields.Offset.value)
		}
		return cloned
	}

	public Embedded(): boolean {
		const f = this
		return f!.Name.IsEmbedded()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'StructField',
	  new StructField(),
	  [{ name: "Embedded", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  StructField,
	  {"Name": "Name", "Typ": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Offset": { kind: $.TypeKind.Basic, name: "uintptr" }}
	);
}

export class StructType {
	public get PkgPath(): Name {
		return this._fields.PkgPath.value
	}
	public set PkgPath(value: Name) {
		this._fields.PkgPath.value = value
	}

	public get Fields(): $.Slice<StructField> {
		return this._fields.Fields.value
	}
	public set Fields(value: $.Slice<StructField>) {
		this._fields.Fields.value = value
	}

	public get Type(): Type {
		return this._fields.Type.value
	}
	public set Type(value: Type) {
		this._fields.Type.value = value
	}

	public _fields: {
		Type: $.VarRef<Type>;
		PkgPath: $.VarRef<Name>;
		Fields: $.VarRef<$.Slice<StructField>>;
	}

	constructor(init?: Partial<{Fields?: $.Slice<StructField>, PkgPath?: Name, Type?: Partial<ConstructorParameters<typeof Type>[0]>}>) {
		this._fields = {
			Type: $.varRef(new Type(init?.Type)),
			PkgPath: $.varRef(init?.PkgPath?.clone() ?? new Name()),
			Fields: $.varRef(init?.Fields ?? null)
		}
	}

	public clone(): StructType {
		const cloned = new StructType()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value.clone()),
			PkgPath: $.varRef(this._fields.PkgPath.value?.clone() ?? null),
			Fields: $.varRef(this._fields.Fields.value)
		}
		return cloned
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
	  'StructType',
	  new StructType(),
	  [],
	  StructType,
	  {"Type": "Type", "PkgPath": "Name", "Fields": { kind: $.TypeKind.Slice, elemType: "StructField" }}
	);
}

export class Name {
	public get Bytes(): $.VarRef<number> | null {
		return this._fields.Bytes.value
	}
	public set Bytes(value: $.VarRef<number> | null) {
		this._fields.Bytes.value = value
	}

	public _fields: {
		Bytes: $.VarRef<$.VarRef<number> | null>;
	}

	constructor(init?: Partial<{Bytes?: $.VarRef<number> | null}>) {
		this._fields = {
			Bytes: $.varRef(init?.Bytes ?? null)
		}
	}

	public clone(): Name {
		const cloned = new Name()
		cloned._fields = {
			Bytes: $.varRef(this._fields.Bytes.value)
		}
		return cloned
	}

	// DataChecked does pointer arithmetic on n's Bytes, and that arithmetic is asserted to
	// be safe for the reason in whySafe (which can appear in a backtrace, etc.)
	public DataChecked(off: number, whySafe: string): $.VarRef<number> | null {
		const n = this
		return (byte!)(addChecked(unsafe.Pointer(n.Bytes), (off as uintptr), whySafe))
	}

	// Data does pointer arithmetic on n's Bytes, and that arithmetic is asserted to
	// be safe because the runtime made the call (other packages use DataChecked)
	public Data(off: number): $.VarRef<number> | null {
		const n = this
		return (byte!)(addChecked(unsafe.Pointer(n.Bytes), (off as uintptr), "the runtime doesn't need to give you a reason"))
	}

	// IsExported returns "is n exported?"
	public IsExported(): boolean {
		const n = this
		return ((n.Bytes!.value) & ((1 << 0))) != 0
	}

	// HasTag returns true iff there is tag data following this name
	public HasTag(): boolean {
		const n = this
		return ((n.Bytes!.value) & ((1 << 1))) != 0
	}

	// IsEmbedded returns true iff n is embedded (an anonymous field).
	public IsEmbedded(): boolean {
		const n = this
		return ((n.Bytes!.value) & ((1 << 3))) != 0
	}

	// ReadVarint parses a varint as encoded by encoding/binary.
	// It returns the number of encoded bytes and the encoded value.
	public ReadVarint(off: number): [number, number] {
		const n = this
		let v = 0
		for (let i = 0; ; i++) {
			let x = n.DataChecked(off + i, "read varint")!.value
			v += (((x & 0x7f) as number) << (7 * i))
			if ((x & 0x80) == 0) {
				return [i + 1, v]
			}
		}
	}

	// IsBlank indicates whether n is "_".
	public IsBlank(): boolean {
		const n = this
		if (n.Bytes == null) {
			return false
		}
		let [, l] = n.ReadVarint(1)
		return l == 1 && n.Data(2)!.value == 95
	}

	// Name returns the tag string for n, or empty if there is none.
	public Name(): string {
		const n = this
		if (n.Bytes == null) {
			return ""
		}
		let [i, l] = n.ReadVarint(1)
		return unsafe.String(n.DataChecked(1 + i, "non-empty string"), l)
	}

	// Tag returns the tag string for n, or empty if there is none.
	public Tag(): string {
		const n = this
		if (!n.HasTag()) {
			return ""
		}
		let [i, l] = n.ReadVarint(1)
		let [i2, l2] = n.ReadVarint(1 + i + l)
		return unsafe.String(n.DataChecked(1 + i + l + i2, "non-empty string"), l2)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'Name',
	  new Name(),
	  [{ name: "DataChecked", args: [{ name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }, { name: "whySafe", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "Data", args: [{ name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Basic, name: "number" } } }] }, { name: "IsExported", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "HasTag", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "IsEmbedded", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "ReadVarint", args: [{ name: "off", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "IsBlank", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Tag", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  Name,
	  {"Bytes": { kind: $.TypeKind.Pointer, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

// writeVarint writes n to buf in varint form. Returns the
// number of bytes written. n must be nonnegative.
// Writes at most 10 bytes.
export function writeVarint(buf: Uint8Array, n: number): number {
	for (let i = 0; ; i++) {
		let b = $.byte((n & 0x7f))
		n >>= 7
		if (n == 0) {
			buf![i] = b
			return i + 1
		}
		buf![i] = (b | 0x80)
	}
}

export function NewName(n: string, tag: string, exported: boolean, embedded: boolean): Name {
	if ($.len(n) >= (1 << 29)) {
		$.panic("abi.NewName: name too long: " + $.sliceString(n, undefined, 1024) + "...")
	}
	if ($.len(tag) >= (1 << 29)) {
		$.panic("abi.NewName: tag too long: " + $.sliceString(tag, undefined, 1024) + "...")
	}
	let nameLen: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	let tagLen: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	let nameLenLen = writeVarint($.goSlice(nameLen, undefined, undefined), $.len(n))
	let tagLenLen = writeVarint($.goSlice(tagLen, undefined, undefined), $.len(tag))

	let bits: number = 0
	let l = 1 + nameLenLen + $.len(n)
	if (exported) {
		bits |= (1 << 0)
	}
	if ($.len(tag) > 0) {
		l += tagLenLen + $.len(tag)
		bits |= (1 << 1)
	}
	if (embedded) {
		bits |= (1 << 3)
	}

	let b = new Uint8Array(l)
	b![0] = bits
	copy(b.subarray(1), $.goSlice(nameLen, undefined, nameLenLen))
	copy(b.subarray(1 + nameLenLen), n)
	if ($.len(tag) > 0) {
		let tb = b.subarray(1 + nameLenLen + $.len(n))
		copy(tb, $.goSlice(tagLen, undefined, tagLenLen))
		copy(tb.subarray(tagLenLen), tag)
	}

	return new Name({Bytes: b![0]})
}

// print no more than 10 args/components
export let TraceArgsLimit: number = 10

// no more than 5 layers of nesting
export let TraceArgsMaxDepth: number = 5

// maxLen is a (conservative) upper bound of the byte stream length. For
// each arg/component, it has no more than 2 bytes of data (size, offset),
// and no more than one {, }, ... at each level (it cannot have both the
// data and ... unless it is the last one, just be conservative). Plus 1
// for _endSeq.
export let TraceArgsMaxLen: number = (5 * 3 + 2) * 10 + 1

export let TraceArgsEndSeq: number = 0xff

export let TraceArgsStartAgg: number = 0xfe

export let TraceArgsEndAgg: number = 0xfd

export let TraceArgsDotdotdot: number = 0xfc

export let TraceArgsOffsetTooLarge: number = 0xfb

// above this are operators, below this are ordinary offsets
export let TraceArgsSpecial: number = 0xf0

export let MaxPtrmaskBytes: number = 2048

