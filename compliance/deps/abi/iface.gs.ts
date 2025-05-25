import * as $ from "@goscript/builtin/builtin.js";

import * as unsafe from "@goscript/unsafe/index.js"

export class ITab {
	public get Inter(): InterfaceType | null {
		return this._fields.Inter.value
	}
	public set Inter(value: InterfaceType | null) {
		this._fields.Inter.value = value
	}

	public get Type(): Type | null {
		return this._fields.Type.value
	}
	public set Type(value: Type | null) {
		this._fields.Type.value = value
	}

	// copy of Type.Hash. Used for type switches.
	public get Hash(): number {
		return this._fields.Hash.value
	}
	public set Hash(value: number) {
		this._fields.Hash.value = value
	}

	// variable sized. fun[0]==0 means Type does not implement Inter.
	public get Fun(): uintptr[] {
		return this._fields.Fun.value
	}
	public set Fun(value: uintptr[]) {
		this._fields.Fun.value = value
	}

	public _fields: {
		Inter: $.VarRef<InterfaceType | null>;
		Type: $.VarRef<Type | null>;
		Hash: $.VarRef<number>;
		Fun: $.VarRef<uintptr[]>;
	}

	constructor(init?: Partial<{Fun?: uintptr[], Hash?: number, Inter?: InterfaceType | null, Type?: Type | null}>) {
		this._fields = {
			Inter: $.varRef(init?.Inter ?? null),
			Type: $.varRef(init?.Type ?? null),
			Hash: $.varRef(init?.Hash ?? 0),
			Fun: $.varRef(init?.Fun ?? [0])
		}
	}

	public clone(): ITab {
		const cloned = new ITab()
		cloned._fields = {
			Inter: $.varRef(this._fields.Inter.value),
			Type: $.varRef(this._fields.Type.value),
			Hash: $.varRef(this._fields.Hash.value),
			Fun: $.varRef(this._fields.Fun.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'ITab',
	  new ITab(),
	  [],
	  ITab,
	  {"Inter": { kind: $.TypeKind.Pointer, elemType: "InterfaceType" }, "Type": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Hash": { kind: $.TypeKind.Basic, name: "number" }, "Fun": { kind: $.TypeKind.Array, length: 1, elemType: { kind: $.TypeKind.Basic, name: "uintptr" } }}
	);
}

export class EmptyInterface {
	public get Type(): Type | null {
		return this._fields.Type.value
	}
	public set Type(value: Type | null) {
		this._fields.Type.value = value
	}

	public get Data(): Pointer {
		return this._fields.Data.value
	}
	public set Data(value: Pointer) {
		this._fields.Data.value = value
	}

	public _fields: {
		Type: $.VarRef<Type | null>;
		Data: $.VarRef<Pointer>;
	}

	constructor(init?: Partial<{Data?: Pointer, Type?: Type | null}>) {
		this._fields = {
			Type: $.varRef(init?.Type ?? null),
			Data: $.varRef(init?.Data ?? 0)
		}
	}

	public clone(): EmptyInterface {
		const cloned = new EmptyInterface()
		cloned._fields = {
			Type: $.varRef(this._fields.Type.value),
			Data: $.varRef(this._fields.Data.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'EmptyInterface',
	  new EmptyInterface(),
	  [],
	  EmptyInterface,
	  {"Type": { kind: $.TypeKind.Pointer, elemType: "Type" }, "Data": { kind: $.TypeKind.Basic, name: "Pointer" }}
	);
}

