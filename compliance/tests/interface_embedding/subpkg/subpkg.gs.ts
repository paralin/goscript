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

export class MockFile {
	public get filename(): string {
		return this._fields.filename.value
	}
	public set filename(value: string) {
		this._fields.filename.value = value
	}

	public get data(): $.Bytes {
		return this._fields.data.value
	}
	public set data(value: $.Bytes) {
		this._fields.data.value = value
	}

	public _fields: {
		filename: $.VarRef<string>;
		data: $.VarRef<$.Bytes>;
	}

	constructor(init?: Partial<{data?: $.Bytes, filename?: string}>) {
		this._fields = {
			filename: $.varRef(init?.filename ?? ""),
			data: $.varRef(init?.data ?? new Uint8Array(0))
		}
	}

	public clone(): MockFile {
		const cloned = new MockFile()
		cloned._fields = {
			filename: $.varRef(this._fields.filename.value),
			data: $.varRef(this._fields.data.value)
		}
		return cloned
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

