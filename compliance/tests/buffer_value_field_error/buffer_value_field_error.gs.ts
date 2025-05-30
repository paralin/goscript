// Generated file based on buffer_value_field_error.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class buffer extends $.GoStruct<{data: $.Bytes}> {

	constructor(init?: Partial<{data?: $.Bytes}>) {
		super({
			data: { type: Object, default: new Uint8Array(0) }
		}, init)
	}

	public clone(): this {
		return super.clone()
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

