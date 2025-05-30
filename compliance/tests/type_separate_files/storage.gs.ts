// Generated file based on storage.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";
import { file } from "./memory.gs.js";

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

