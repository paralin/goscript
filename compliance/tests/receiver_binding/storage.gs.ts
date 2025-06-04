// Generated file based on storage.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

export class storage {
	public get bytes(): $.Bytes {
		return this._fields.bytes.value
	}
	public set bytes(value: $.Bytes) {
		this._fields.bytes.value = value
	}

	public get name(): string {
		return this._fields.name.value
	}
	public set name(value: string) {
		this._fields.name.value = value
	}

	public _fields: {
		bytes: $.VarRef<$.Bytes>;
		name: $.VarRef<string>;
	}

	constructor(init?: Partial<{bytes?: $.Bytes, name?: string}>) {
		this._fields = {
			bytes: $.varRef(init?.bytes ?? new Uint8Array(0)),
			name: $.varRef(init?.name ?? "")
		}
	}

	public clone(): storage {
		const cloned = new storage()
		cloned._fields = {
			bytes: $.varRef(this._fields.bytes.value),
			name: $.varRef(this._fields.name.value)
		}
		return cloned
	}

	// Very simple method - just field access
	public Len(): number {
		const s = this
		return $.len(s.bytes)
	}

	// Very simple method - just field assignment
	public Truncate(): void {
		const s = this
		s.bytes = new Uint8Array(0)
	}

	// Simple method - field access in return
	public Name(): string {
		const s = this
		return s.name
	}

	// Simple method - field assignment with parameter
	public SetName(name: string): void {
		const s = this
		s.name = name
	}

	// Simple method - field access with built-in function call
	public IsEmpty(): boolean {
		const s = this
		return $.len(s.bytes) == 0
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'storage',
	  new storage(),
	  [{ name: "Len", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Truncate", args: [], returns: [] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "SetName", args: [{ name: "name", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [] }, { name: "IsEmpty", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  storage,
	  {"bytes": { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } }, "name": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

export async function main(): Promise<void> {
	let s = new storage({bytes: new Uint8Array(5), name: "test"})

	console.log("Name:", s.Name())
	console.log("Length:", s.Len())
	console.log("Empty:", s.IsEmpty())

	s.Truncate()
	console.log("Length after truncate:", s.Len())

	s.SetName("new_name")
	console.log("New name:", s.Name())
}

