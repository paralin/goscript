// Generated file based on memory.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class file {
	public get name(): string {
		return this._fields.name.value
	}
	public set name(value: string) {
		this._fields.name.value = value
	}

	public get data(): $.Bytes {
		return this._fields.data.value
	}
	public set data(value: $.Bytes) {
		this._fields.data.value = value
	}

	public _fields: {
		name: $.VarRef<string>;
		data: $.VarRef<$.Bytes>;
	}

	constructor(init?: Partial<{data?: $.Bytes, name?: string}>) {
		this._fields = {
			name: $.varRef(init?.name ?? // DEBUG: Field name has type string (*types.Basic)
			// DEBUG: Using default zero value
			""),
			data: $.varRef(init?.data ?? // DEBUG: Field data has type []byte (*types.Slice)
			// DEBUG: Using default zero value
			new Uint8Array(0))
		}
	}

	public clone(): file {
		const cloned = new file()
		cloned._fields = {
			name: $.varRef(this._fields.name.value),
			data: $.varRef(this._fields.data.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'file',
	  new file(),
	  [],
	  file,
	  {"name": { kind: $.TypeKind.Basic, name: "string" }, "data": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }}
	);
}

