// Generated file based on buffer_value_field_error.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

class buffer {
	public get data(): $.Bytes {
		return this._fields.data.value
	}
	public set data(value: $.Bytes) {
		this._fields.data.value = value
	}

	public _fields: {
		data: $.VarRef<$.Bytes>;
	}

	constructor(init?: Partial<{data?: $.Bytes}>) {
		this._fields = {
			data: $.varRef(init?.data ?? new Uint8Array(0))
		}
	}

	public clone(): buffer {
		const cloned = new buffer()
		cloned._fields = {
			data: $.varRef(this._fields.data.value)
		}
		return cloned
	}

	public write(p: $.Bytes): void {
		const b = this
		b.data = $.append(b.data, p)
	}

	public writeString(s: string): void {
		const b = this
		b.data = $.append(b.data, ...$.stringToBytes(s))
	}

	public writeByte(c: number): void {
		const b = this
		b.data = $.append(b.data, c)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'buffer',
	  new buffer(),
	  [{ name: "write", args: [{ name: "p", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [] }, { name: "writeString", args: [{ name: "s", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [] }, { name: "writeByte", args: [{ name: "c", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [] }],
	  buffer,
	  {"data": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

export async function main(): Promise<void> {
	let buf = new buffer({})

	// Test write
	buf!.write($.stringToBytes("hello"))
	console.log("After write:", $.bytesToString(buf!.data))

	// Test writeString
	buf!.writeString(" world")
	console.log("After writeString:", $.bytesToString(buf!.data))

	// Test writeByte
	buf!.writeByte(33)
	console.log("After writeByte:", $.bytesToString(buf!.data))
}

