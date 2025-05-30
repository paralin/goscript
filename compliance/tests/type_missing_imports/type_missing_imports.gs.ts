// Generated file based on type_missing_imports.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class file extends $.GoStruct<{name: string; data: $.Bytes}> {

	constructor(init?: Partial<{data?: $.Bytes, name?: string}>) {
		super({
			name: { type: String, default: "" },
			data: { type: Object, default: new Uint8Array(0) }
		}, init)
	}

	public clone(): this {
		return super.clone()
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

export class storage extends $.GoStruct<{files: Map<string, file | null> | null; children: Map<string, Map<string, file | null> | null> | null}> {

	constructor(init?: Partial<{children?: Map<string, Map<string, file | null> | null> | null, files?: Map<string, file | null> | null}>) {
		super({
			files: { type: Object, default: null },
			children: { type: Object, default: null }
		}, init)
	}

	public clone(): this {
		return super.clone()
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

	console.log("Created storage with file:", $.mapGet(s.files, "test", null)[0]!!.name)
}

