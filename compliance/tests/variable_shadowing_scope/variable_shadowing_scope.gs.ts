// Generated file based on variable_shadowing_scope.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as os from "@goscript/os/index.js"

import * as filepath from "@goscript/path/filepath/index.js"

export type FileInfo = null | {
	Name(): string
}

$.registerInterfaceType(
  'FileInfo',
  null, // Zero value for interface is null
  [{ name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }]
);

class mockFileInfo {
	public get name(): string {
		return this._fields.name.value
	}
	public set name(value: string) {
		this._fields.name.value = value
	}

	public _fields: {
		name: $.VarRef<string>;
	}

	constructor(init?: Partial<{name?: string}>) {
		this._fields = {
			name: $.varRef(init?.name ?? "")
		}
	}

	public clone(): mockFileInfo {
		const cloned = new mockFileInfo()
		cloned._fields = {
			name: $.varRef(this._fields.name.value)
		}
		return cloned
	}

	public Name(): string {
		const m = this
		return m.name
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'mockFileInfo',
	  new mockFileInfo(),
	  [{ name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }],
	  mockFileInfo,
	  {"name": { kind: $.TypeKind.Basic, name: "string" }}
	);
}

class mockFS {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): mockFS {
		const cloned = new mockFS()
		cloned._fields = {
		}
		return cloned
	}

	public Lstat(filename: string): [FileInfo, $.GoError] {
		const fs = this
		if (filename == "error.txt") {
			return [null, os.ErrNotExist]
		}
		return [new mockFileInfo({name: filename}), null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'mockFS',
	  new mockFS(),
	  [{ name: "Lstat", args: [{ name: "filename", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: "FileInfo" }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  mockFS,
	  {}
	);
}

export function walkFn(filename: string, info: FileInfo, err: $.GoError): $.GoError {
	if (err != null) {
		console.log("Error walking:", filename, "error:", err!.Error())
		return null
	}
	console.log("File:", filename)
	return null
}

export async function main(): Promise<void> {
	let fs = new mockFS({})
	let filename = "error.txt"

	let [fileInfo, err] = fs.Lstat(filename)
	{
		let err = walkFn(filename, fileInfo, err)
		if (err != null && err != filepath.SkipDir) {
			console.log("Walk function returned error")
			return 
		}
	}

	console.log("Walk completed successfully")
}

