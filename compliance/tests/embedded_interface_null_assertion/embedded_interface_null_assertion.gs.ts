// Generated file based on embedded_interface_null_assertion.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type Reader = null | {
	Read(p: $.Bytes): [number, $.GoError]
}

$.registerInterfaceType(
  'Reader',
  null, // Zero value for interface is null
  [{ name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export class MyReader {
	public get name(): string {
		return this._fields.name.value
	}
	public set name(value: string) {
		this._fields.name.value = value
	}

	public get Reader(): Reader {
		return this._fields.Reader.value
	}
	public set Reader(value: Reader) {
		this._fields.Reader.value = value
	}

	public _fields: {
		Reader: $.VarRef<Reader>;
		name: $.VarRef<string>;
	}

	constructor(init?: Partial<{Reader?: Reader, name?: string}>) {
		this._fields = {
			Reader: $.varRef(init?.Reader ?? null),
			name: $.varRef(init?.name ?? // DEBUG: Field name has type string (*types.Basic)
			// DEBUG: Using default zero value
			"")
		}
	}

	public clone(): MyReader {
		const cloned = new MyReader()
		cloned._fields = {
			Reader: $.varRef(this._fields.Reader.value),
			name: $.varRef(this._fields.name.value)
		}
		return cloned
	}

	public Read(p: $.Bytes): [number, $.GoError] {
		return this.Reader!.Read(p)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyReader',
	  new MyReader(),
	  [],
	  MyReader,
	  {"Reader": "Reader", "name": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export class StringReader {
	public get data(): string {
		return this._fields.data.value
	}
	public set data(value: string) {
		this._fields.data.value = value
	}

	public get pos(): number {
		return this._fields.pos.value
	}
	public set pos(value: number) {
		this._fields.pos.value = value
	}

	public _fields: {
		data: $.VarRef<string>;
		pos: $.VarRef<number>;
	}

	constructor(init?: Partial<{data?: string, pos?: number}>) {
		this._fields = {
			data: $.varRef(init?.data ?? // DEBUG: Field data has type string (*types.Basic)
			// DEBUG: Using default zero value
			""),
			pos: $.varRef(init?.pos ?? // DEBUG: Field pos has type int (*types.Basic)
			// DEBUG: Using default zero value
			0)
		}
	}

	public clone(): StringReader {
		const cloned = new StringReader()
		cloned._fields = {
			data: $.varRef(this._fields.data.value),
			pos: $.varRef(this._fields.pos.value)
		}
		return cloned
	}

	public Read(p: $.Bytes): [number, $.GoError] {
		const s = this
		if (s.pos >= $.len(s.data)) {
			return [0, null]
		}
		let n = $.copy(p, $.stringToBytes($.sliceString(s.data, s.pos, undefined)))
		s.pos += n
		return [n, null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'StringReader',
	  new StringReader(),
	  [{ name: "Read", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  StringReader,
	  {"data": { kind: $.TypeKind.Basic, name: "string" }, "pos": { kind: $.TypeKind.Basic, name: "number" }}
	);
}

export async function main(): Promise<void> {
	let mr1 = new MyReader({name: "test1"})
	console.log(mr1!.Reader == null)

	let sr = new StringReader({data: "hello", pos: 0})
	let mr2 = new MyReader({name: "test2", Reader: sr})
	console.log(mr2!.Reader != null)

	let buf = new Uint8Array(5)
	let [n, ] = mr2!.Read(buf)
	console.log(n == 5)

	console.log(10)
	console.log(15)
	console.log(true)
}

