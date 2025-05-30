// Generated file based on missing_valueof_error.go
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

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'buffer',
	  new buffer(),
	  [],
	  buffer,
	  {"data": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

export class printer extends $.GoStruct<{buf: buffer | null}> {

	constructor(init?: Partial<{buf?: buffer | null}>) {
		super({
			buf: { type: Object, default: null }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public free(): void {
		const p = this
		if ($.cap(p.buf!.data) > 64 * 1024) {
			p.buf = null
		} else {
			// Reset buffer
			p.buf!.data = $.goSlice(p.buf!.data, undefined, 0)
		}
	}

	public checkCapacity(): number {
		const p = this
		return $.cap(p.buf!.data)
	}

	public getLength(): number {
		const p = this
		return $.len(p.buf!.data)
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'printer',
	  new printer(),
	  [{ name: "free", args: [], returns: [] }, { name: "checkCapacity", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "getLength", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }],
	  printer,
	  {"buf": { kind: $.TypeKind.Pointer, elemType: "buffer" }}
	);
}

export async function main(): Promise<void> {
	let buf = new buffer({data: $.makeSlice<number>(0, 100000, 'byte')})
	let p = new printer({buf: buf})

	console.log("Initial capacity:", p.checkCapacity())
	console.log("Initial length:", p.getLength())

	// Add some data
	p.buf!.data = $.append(p.buf!.data, ...$.stringToBytes("hello world"))
	console.log("After append length:", p.getLength())

	// Test free
	p.free()
	if (p.buf != null) {
		console.log("Buffer not freed, capacity:", p.checkCapacity())
	} else {
		console.log("Buffer was freed")
	}
}

