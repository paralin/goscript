// Generated file based on storage.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";
import { file } from "./memory.gs.js";

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

