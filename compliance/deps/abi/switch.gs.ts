import * as $ from "@goscript/builtin/builtin.js";

export class InterfaceSwitch {
	public get Cache(): InterfaceSwitchCache | null {
		return this._fields.Cache.value
	}
	public set Cache(value: InterfaceSwitchCache | null) {
		this._fields.Cache.value = value
	}

	public get NCases(): number {
		return this._fields.NCases.value
	}
	public set NCases(value: number) {
		this._fields.NCases.value = value
	}

	// Array of NCases elements.
	// Each case must be a non-empty interface type.
	public get Cases(): InterfaceType | null[] {
		return this._fields.Cases.value
	}
	public set Cases(value: InterfaceType | null[]) {
		this._fields.Cases.value = value
	}

	public _fields: {
		Cache: $.VarRef<InterfaceSwitchCache | null>;
		NCases: $.VarRef<number>;
		Cases: $.VarRef<InterfaceType | null[]>;
	}

	constructor(init?: Partial<{Cache?: InterfaceSwitchCache | null, Cases?: InterfaceType | null[], NCases?: number}>) {
		this._fields = {
			Cache: $.varRef(init?.Cache ?? null),
			NCases: $.varRef(init?.NCases ?? 0),
			Cases: $.varRef(init?.Cases ?? [null])
		}
	}

	public clone(): InterfaceSwitch {
		const cloned = new InterfaceSwitch()
		cloned._fields = {
			Cache: $.varRef(this._fields.Cache.value),
			NCases: $.varRef(this._fields.NCases.value),
			Cases: $.varRef(this._fields.Cases.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'InterfaceSwitch',
	  new InterfaceSwitch(),
	  [],
	  InterfaceSwitch,
	  {"Cache": { kind: $.TypeKind.Pointer, elemType: "InterfaceSwitchCache" }, "NCases": { kind: $.TypeKind.Basic, name: "number" }, "Cases": { kind: $.TypeKind.Array, length: 1, elemType: { kind: $.TypeKind.Pointer, elemType: "InterfaceType" } }}
	);
}

export class InterfaceSwitchCache {
	// mask for index. Must be a power of 2 minus 1
	public get Mask(): uintptr {
		return this._fields.Mask.value
	}
	public set Mask(value: uintptr) {
		this._fields.Mask.value = value
	}

	// Mask+1 entries total
	public get Entries(): InterfaceSwitchCacheEntry[] {
		return this._fields.Entries.value
	}
	public set Entries(value: InterfaceSwitchCacheEntry[]) {
		this._fields.Entries.value = value
	}

	public _fields: {
		Mask: $.VarRef<uintptr>;
		Entries: $.VarRef<InterfaceSwitchCacheEntry[]>;
	}

	constructor(init?: Partial<{Entries?: InterfaceSwitchCacheEntry[], Mask?: uintptr}>) {
		this._fields = {
			Mask: $.varRef(init?.Mask ?? 0),
			Entries: $.varRef(init?.Entries ?? [new InterfaceSwitchCacheEntry()])
		}
	}

	public clone(): InterfaceSwitchCache {
		const cloned = new InterfaceSwitchCache()
		cloned._fields = {
			Mask: $.varRef(this._fields.Mask.value),
			Entries: $.varRef(this._fields.Entries.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'InterfaceSwitchCache',
	  new InterfaceSwitchCache(),
	  [],
	  InterfaceSwitchCache,
	  {"Mask": { kind: $.TypeKind.Basic, name: "uintptr" }, "Entries": { kind: $.TypeKind.Array, length: 1, elemType: "InterfaceSwitchCacheEntry" }}
	);
}

export class InterfaceSwitchCacheEntry {
	// type of source value (a *Type)
	public get Typ(): uintptr {
		return this._fields.Typ.value
	}
	public set Typ(value: uintptr) {
		this._fields.Typ.value = value
	}

	// case # to dispatch to
	public get Case(): number {
		return this._fields.Case.value
	}
	public set Case(value: number) {
		this._fields.Case.value = value
	}

	// itab to use for resulting case variable (a *runtime.itab)
	public get Itab(): uintptr {
		return this._fields.Itab.value
	}
	public set Itab(value: uintptr) {
		this._fields.Itab.value = value
	}

	public _fields: {
		Typ: $.VarRef<uintptr>;
		Case: $.VarRef<number>;
		Itab: $.VarRef<uintptr>;
	}

	constructor(init?: Partial<{Case?: number, Itab?: uintptr, Typ?: uintptr}>) {
		this._fields = {
			Typ: $.varRef(init?.Typ ?? 0),
			Case: $.varRef(init?.Case ?? 0),
			Itab: $.varRef(init?.Itab ?? 0)
		}
	}

	public clone(): InterfaceSwitchCacheEntry {
		const cloned = new InterfaceSwitchCacheEntry()
		cloned._fields = {
			Typ: $.varRef(this._fields.Typ.value),
			Case: $.varRef(this._fields.Case.value),
			Itab: $.varRef(this._fields.Itab.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'InterfaceSwitchCacheEntry',
	  new InterfaceSwitchCacheEntry(),
	  [],
	  InterfaceSwitchCacheEntry,
	  {"Typ": { kind: $.TypeKind.Basic, name: "uintptr" }, "Case": { kind: $.TypeKind.Basic, name: "number" }, "Itab": { kind: $.TypeKind.Basic, name: "uintptr" }}
	);
}

let go122InterfaceSwitchCache: boolean = true

export function UseInterfaceSwitchCache(goarch: string): boolean {
	if (!true) {
		return false
	}
	// We need an atomic load instruction to make the cache multithreaded-safe.
	// (AtomicLoadPtr needs to be implemented in cmd/compile/internal/ssa/_gen/ARCH.rules.)
	switch (goarch) {
		case "amd64":
		case "arm64":
		case "loong64":
		case "mips":
		case "mipsle":
		case "mips64":
		case "mips64le":
		case "ppc64":
		case "ppc64le":
		case "riscv64":
		case "s390x":
			return true
			break
		default:
			return false
			break
	}
}

export class TypeAssert {
	public get Cache(): TypeAssertCache | null {
		return this._fields.Cache.value
	}
	public set Cache(value: TypeAssertCache | null) {
		this._fields.Cache.value = value
	}

	public get Inter(): InterfaceType | null {
		return this._fields.Inter.value
	}
	public set Inter(value: InterfaceType | null) {
		this._fields.Inter.value = value
	}

	public get CanFail(): boolean {
		return this._fields.CanFail.value
	}
	public set CanFail(value: boolean) {
		this._fields.CanFail.value = value
	}

	public _fields: {
		Cache: $.VarRef<TypeAssertCache | null>;
		Inter: $.VarRef<InterfaceType | null>;
		CanFail: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{Cache?: TypeAssertCache | null, CanFail?: boolean, Inter?: InterfaceType | null}>) {
		this._fields = {
			Cache: $.varRef(init?.Cache ?? null),
			Inter: $.varRef(init?.Inter ?? null),
			CanFail: $.varRef(init?.CanFail ?? false)
		}
	}

	public clone(): TypeAssert {
		const cloned = new TypeAssert()
		cloned._fields = {
			Cache: $.varRef(this._fields.Cache.value),
			Inter: $.varRef(this._fields.Inter.value),
			CanFail: $.varRef(this._fields.CanFail.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'TypeAssert',
	  new TypeAssert(),
	  [],
	  TypeAssert,
	  {"Cache": { kind: $.TypeKind.Pointer, elemType: "TypeAssertCache" }, "Inter": { kind: $.TypeKind.Pointer, elemType: "InterfaceType" }, "CanFail": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

export class TypeAssertCache {
	public get Mask(): uintptr {
		return this._fields.Mask.value
	}
	public set Mask(value: uintptr) {
		this._fields.Mask.value = value
	}

	public get Entries(): TypeAssertCacheEntry[] {
		return this._fields.Entries.value
	}
	public set Entries(value: TypeAssertCacheEntry[]) {
		this._fields.Entries.value = value
	}

	public _fields: {
		Mask: $.VarRef<uintptr>;
		Entries: $.VarRef<TypeAssertCacheEntry[]>;
	}

	constructor(init?: Partial<{Entries?: TypeAssertCacheEntry[], Mask?: uintptr}>) {
		this._fields = {
			Mask: $.varRef(init?.Mask ?? 0),
			Entries: $.varRef(init?.Entries ?? [new TypeAssertCacheEntry()])
		}
	}

	public clone(): TypeAssertCache {
		const cloned = new TypeAssertCache()
		cloned._fields = {
			Mask: $.varRef(this._fields.Mask.value),
			Entries: $.varRef(this._fields.Entries.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'TypeAssertCache',
	  new TypeAssertCache(),
	  [],
	  TypeAssertCache,
	  {"Mask": { kind: $.TypeKind.Basic, name: "uintptr" }, "Entries": { kind: $.TypeKind.Array, length: 1, elemType: "TypeAssertCacheEntry" }}
	);
}

export class TypeAssertCacheEntry {
	// type of source value (a *runtime._type)
	public get Typ(): uintptr {
		return this._fields.Typ.value
	}
	public set Typ(value: uintptr) {
		this._fields.Typ.value = value
	}

	// itab to use for result (a *runtime.itab)
	// nil if CanFail is set and conversion would fail.
	public get Itab(): uintptr {
		return this._fields.Itab.value
	}
	public set Itab(value: uintptr) {
		this._fields.Itab.value = value
	}

	public _fields: {
		Typ: $.VarRef<uintptr>;
		Itab: $.VarRef<uintptr>;
	}

	constructor(init?: Partial<{Itab?: uintptr, Typ?: uintptr}>) {
		this._fields = {
			Typ: $.varRef(init?.Typ ?? 0),
			Itab: $.varRef(init?.Itab ?? 0)
		}
	}

	public clone(): TypeAssertCacheEntry {
		const cloned = new TypeAssertCacheEntry()
		cloned._fields = {
			Typ: $.varRef(this._fields.Typ.value),
			Itab: $.varRef(this._fields.Itab.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'TypeAssertCacheEntry',
	  new TypeAssertCacheEntry(),
	  [],
	  TypeAssertCacheEntry,
	  {"Typ": { kind: $.TypeKind.Basic, name: "uintptr" }, "Itab": { kind: $.TypeKind.Basic, name: "uintptr" }}
	);
}

