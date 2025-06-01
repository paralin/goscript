// Generated file based on undefined_type_error.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class formatter {
	public get wid(): number {
		return this._fields.wid.value
	}
	public set wid(value: number) {
		this._fields.wid.value = value
	}

	public get prec(): number {
		return this._fields.prec.value
	}
	public set prec(value: number) {
		this._fields.prec.value = value
	}

	public get widPresent(): boolean {
		return this._fields.widPresent.value
	}
	public set widPresent(value: boolean) {
		this._fields.widPresent.value = value
	}

	public get precPresent(): boolean {
		return this._fields.precPresent.value
	}
	public set precPresent(value: boolean) {
		this._fields.precPresent.value = value
	}

	public get minus(): boolean {
		return this._fields.minus.value
	}
	public set minus(value: boolean) {
		this._fields.minus.value = value
	}

	public get plus(): boolean {
		return this._fields.plus.value
	}
	public set plus(value: boolean) {
		this._fields.plus.value = value
	}

	public get sharp(): boolean {
		return this._fields.sharp.value
	}
	public set sharp(value: boolean) {
		this._fields.sharp.value = value
	}

	public get space(): boolean {
		return this._fields.space.value
	}
	public set space(value: boolean) {
		this._fields.space.value = value
	}

	public get zero(): boolean {
		return this._fields.zero.value
	}
	public set zero(value: boolean) {
		this._fields.zero.value = value
	}

	public get plusV(): boolean {
		return this._fields.plusV.value
	}
	public set plusV(value: boolean) {
		this._fields.plusV.value = value
	}

	public get sharpV(): boolean {
		return this._fields.sharpV.value
	}
	public set sharpV(value: boolean) {
		this._fields.sharpV.value = value
	}

	public _fields: {
		wid: $.VarRef<number>;
		prec: $.VarRef<number>;
		widPresent: $.VarRef<boolean>;
		precPresent: $.VarRef<boolean>;
		minus: $.VarRef<boolean>;
		plus: $.VarRef<boolean>;
		sharp: $.VarRef<boolean>;
		space: $.VarRef<boolean>;
		zero: $.VarRef<boolean>;
		plusV: $.VarRef<boolean>;
		sharpV: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{minus?: boolean, plus?: boolean, plusV?: boolean, prec?: number, precPresent?: boolean, sharp?: boolean, sharpV?: boolean, space?: boolean, wid?: number, widPresent?: boolean, zero?: boolean}>) {
		this._fields = {
			wid: $.varRef(init?.wid ?? // DEBUG: Field wid has type int (*types.Basic)
			// DEBUG: Using default zero value
			0),
			prec: $.varRef(init?.prec ?? // DEBUG: Field prec has type int (*types.Basic)
			// DEBUG: Using default zero value
			0),
			widPresent: $.varRef(init?.widPresent ?? // DEBUG: Field widPresent has type bool (*types.Basic)
			// DEBUG: Using default zero value
			false),
			precPresent: $.varRef(init?.precPresent ?? // DEBUG: Field precPresent has type bool (*types.Basic)
			// DEBUG: Using default zero value
			false),
			minus: $.varRef(init?.minus ?? // DEBUG: Field minus has type bool (*types.Basic)
			// DEBUG: Using default zero value
			false),
			plus: $.varRef(init?.plus ?? // DEBUG: Field plus has type bool (*types.Basic)
			// DEBUG: Using default zero value
			false),
			sharp: $.varRef(init?.sharp ?? // DEBUG: Field sharp has type bool (*types.Basic)
			// DEBUG: Using default zero value
			false),
			space: $.varRef(init?.space ?? // DEBUG: Field space has type bool (*types.Basic)
			// DEBUG: Using default zero value
			false),
			zero: $.varRef(init?.zero ?? // DEBUG: Field zero has type bool (*types.Basic)
			// DEBUG: Using default zero value
			false),
			plusV: $.varRef(init?.plusV ?? // DEBUG: Field plusV has type bool (*types.Basic)
			// DEBUG: Using default zero value
			false),
			sharpV: $.varRef(init?.sharpV ?? // DEBUG: Field sharpV has type bool (*types.Basic)
			// DEBUG: Using default zero value
			false)
		}
	}

	public clone(): formatter {
		const cloned = new formatter()
		cloned._fields = {
			wid: $.varRef(this._fields.wid.value),
			prec: $.varRef(this._fields.prec.value),
			widPresent: $.varRef(this._fields.widPresent.value),
			precPresent: $.varRef(this._fields.precPresent.value),
			minus: $.varRef(this._fields.minus.value),
			plus: $.varRef(this._fields.plus.value),
			sharp: $.varRef(this._fields.sharp.value),
			space: $.varRef(this._fields.space.value),
			zero: $.varRef(this._fields.zero.value),
			plusV: $.varRef(this._fields.plusV.value),
			sharpV: $.varRef(this._fields.sharpV.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'formatter',
	  new formatter(),
	  [],
	  formatter,
	  {"wid": { kind: $.TypeKind.Basic, name: "number" }, "prec": { kind: $.TypeKind.Basic, name: "number" }, "widPresent": { kind: $.TypeKind.Basic, name: "boolean" }, "precPresent": { kind: $.TypeKind.Basic, name: "boolean" }, "minus": { kind: $.TypeKind.Basic, name: "boolean" }, "plus": { kind: $.TypeKind.Basic, name: "boolean" }, "sharp": { kind: $.TypeKind.Basic, name: "boolean" }, "space": { kind: $.TypeKind.Basic, name: "boolean" }, "zero": { kind: $.TypeKind.Basic, name: "boolean" }, "plusV": { kind: $.TypeKind.Basic, name: "boolean" }, "sharpV": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

export class printer {
	public get buf(): $.Bytes {
		return this._fields.buf.value
	}
	public set buf(value: $.Bytes) {
		this._fields.buf.value = value
	}

	public get arg(): null | any {
		return this._fields.arg.value
	}
	public set arg(value: null | any) {
		this._fields.arg.value = value
	}

	// This line causes the issue: fmt: $.VarRef<fmt>; where fmt is undefined
	// Should generate proper type reference
	public get fmt(): formatter {
		return this._fields.fmt.value
	}
	public set fmt(value: formatter) {
		this._fields.fmt.value = value
	}

	public _fields: {
		buf: $.VarRef<$.Bytes>;
		arg: $.VarRef<null | any>;
		fmt: $.VarRef<formatter>;
	}

	constructor(init?: Partial<{arg?: null | any, buf?: $.Bytes, fmt?: formatter}>) {
		this._fields = {
			buf: $.varRef(init?.buf ?? // DEBUG: Field buf has type []byte (*types.Slice)
			// DEBUG: Using default zero value
			new Uint8Array(0)),
			arg: $.varRef(init?.arg ?? // DEBUG: Field arg has type interface{} (*types.Interface)
			// DEBUG: Using default zero value
			null),
			fmt: $.varRef(init?.fmt?.clone() ?? new formatter())
		}
	}

	public clone(): printer {
		const cloned = new printer()
		cloned._fields = {
			buf: $.varRef(this._fields.buf.value),
			arg: $.varRef(this._fields.arg.value),
			fmt: $.varRef(this._fields.fmt.value?.clone() ?? null)
		}
		return cloned
	}

	public init(): void {
		const p = this
		p.fmt = new formatter({})
	}

	public format(verb: number): void {
		const p = this
		if (p.fmt.minus) {
			console.log("minus flag set")
		}
		if (p.fmt.plus) {
			console.log("plus flag set")
		}
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'printer',
	  new printer(),
	  [{ name: "init", args: [], returns: [] }, { name: "format", args: [{ name: "verb", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }],
	  printer,
	  {"buf": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "arg": { kind: $.TypeKind.Interface, methods: [] }, "fmt": "formatter"}
	);
}

export async function main(): Promise<void> {
	let p = new printer({})
	p.init()
	p.format(100)
	console.log("Formatter test completed")
}

