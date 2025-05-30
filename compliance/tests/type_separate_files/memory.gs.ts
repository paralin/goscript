// Generated file based on memory.go
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

