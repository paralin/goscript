// Generated file based on subpkg/subpkg.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export type File = null | {
	// Close closes the file
	Close(): $.GoError
	// Name returns the name of the file
	Name(): string
	// Write writes data to the file
	Write(data: $.Bytes): [number, $.GoError]
}

$.registerInterfaceType(
  'File',
  null, // Zero value for interface is null
  [{ name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Write", args: [{ name: "data", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export class MockFile extends $.GoStruct<{filename: string; data: $.Bytes}> {

	constructor(init?: Partial<{data?: $.Bytes, filename?: string}>) {
		super({
			filename: { type: String, default: "" },
			data: { type: Object, default: new Uint8Array(0) }
		}, init)
	}

	public clone(): this {
		return super.clone()
	}

	public Name(): string {
		const m = this
		return m.filename
	}

	public Close(): $.GoError {
		return null
	}

	public Write(data: $.Bytes): [number, $.GoError] {
		const m = this
		m.data = $.append(m.data, data)
		return [$.len(data), null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MockFile',
	  new MockFile(),
	  [{ name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }, { name: "Write", args: [{ name: "data", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  MockFile,
	  {"filename": { kind: $.TypeKind.Basic, name: "string" }, "data": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

export function NewMockFile(name: string): MockFile | null {
	return new MockFile({data: new Uint8Array(0), filename: name})
}

