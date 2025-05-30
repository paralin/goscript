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

export class MyReader extends $.GoStruct<{Reader: Reader; name: string}> {

	constructor(init?: Partial<{Reader?: Reader, name?: string}>) {
		super({
			Reader: { type: Object, default: null, isEmbedded: true },
			name: { type: String, default: "" }
		}, init)
	}

	public clone(): this {
		return super.clone()
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

export class StringReader extends $.GoStruct<{data: string; pos: number}> {

	constructor(init?: Partial<{data?: string, pos?: number}>) {
		super({
			data: { type: String, default: "" },
			pos: { type: Number, default: 0 }
		}, init)
	}

	public clone(): this {
		return super.clone()
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

