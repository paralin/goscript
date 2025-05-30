// Generated file based on type_missing_imports.go
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
			name: $.varRef(init?.name ?? ""),
			data: $.varRef(init?.data ?? new Uint8Array(0))
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

export class storage {
	public get files(): Map<string, file | null> | null {
		return this._fields.files.value
	}
	public set files(value: Map<string, file | null> | null) {
		this._fields.files.value = value
	}

	public get children(): Map<string, Map<string, file | null> | null> | null {
		return this._fields.children.value
	}
	public set children(value: Map<string, Map<string, file | null> | null> | null) {
		this._fields.children.value = value
	}

	public _fields: {
		files: $.VarRef<Map<string, file | null> | null>;
		children: $.VarRef<Map<string, Map<string, file | null> | null> | null>;
	}

	constructor(init?: Partial<{children?: Map<string, Map<string, file | null> | null> | null, files?: Map<string, file | null> | null}>) {
		this._fields = {
			files: $.varRef(init?.files ?? null),
			children: $.varRef(init?.children ?? null)
		}
	}

	public clone(): storage {
		const cloned = new storage()
		cloned._fields = {
			files: $.varRef(this._fields.files.value),
			children: $.varRef(this._fields.children.value)
		}
		return cloned
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'storage',
	  new storage(),
	  [],
	  storage,
	  {"files": { kind: $.TypeKind.Map, keyType: { kind: $.TypeKind.Basic, name: "string" }, elemType: { kind: $.TypeKind.Pointer, elemType: "file" } }, "children": { kind: $.TypeKind.Map, keyType: { kind: $.TypeKind.Basic, name: "string" }, elemType: { kind: $.TypeKind.Map, keyType: { kind: $.TypeKind.Basic, name: "string" }, elemType: { kind: $.TypeKind.Pointer, elemType: "file" } } }}
	);
}

export async function main(): Promise<void> {
	let s = new storage({children: $.makeMap<string, Map<string, file | null> | null>(), files: $.makeMap<string, file | null>()})

	let f = new file({data: $.stringToBytes("hello world"), name: "test.txt"})

	$.mapSet(s.files, "test", f)

	console.log("Created storage with file:", $.mapGet(s.files, "test", null)[0]!.name)
}

