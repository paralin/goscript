// Generated file based on interface_type_reference.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as os from "@goscript/os/index.js"

export type Basic = null | {
	// Stat returns a FileInfo describing the named file.
	Stat(filename: string): [os.FileInfo, $.GoError]
}

$.registerInterfaceType(
  'Basic',
  null, // Zero value for interface is null
  [{ name: "Stat", args: [{ name: "filename", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Interface, methods: [{ name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "ModTime", args: [], returns: [{ type: "Time" }] }, { name: "Mode", args: [], returns: [{ type: "FileMode" }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Sys", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }] } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export class MyStorage {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): MyStorage {
		const cloned = new MyStorage()
		cloned._fields = {
		}
		return cloned
	}

	public Stat(filename: string): [os.FileInfo, $.GoError] {
		const s = this
		return [null, null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MyStorage',
	  new MyStorage(),
	  [{ name: "Stat", args: [{ name: "filename", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Interface, methods: [{ name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "ModTime", args: [], returns: [{ type: "Time" }] }, { name: "Mode", args: [], returns: [{ type: "FileMode" }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Sys", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }] } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  MyStorage,
	  {}
	);
}

export async function main(): Promise<void> {
	let b: Basic = new MyStorage({})
	let [, err] = b!.Stat("test.txt")
	if (err == null) {
		console.log("Stat call successful")
	}
}

