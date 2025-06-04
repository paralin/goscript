// Generated file based on filepath_walkfunc_call.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as os from "@goscript/os/index.js"

import * as filepath from "@goscript/path/filepath/index.js"

import * as time from "@goscript/time/index.js"

export type Filesystem = null | {
	ReadDir(path: string): [$.Slice<os.FileInfo>, $.GoError]
}

$.registerInterfaceType(
  'Filesystem',
  null, // Zero value for interface is null
  [{ name: "ReadDir", args: [{ name: "path", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Interface, methods: [{ name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "ModTime", args: [], returns: [{ type: "Time" }] }, { name: "Mode", args: [], returns: [{ type: "FileMode" }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Sys", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }] } } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

export class MockFileInfo {
	public get name(): string {
		return this._fields.name.value
	}
	public set name(value: string) {
		this._fields.name.value = value
	}

	public get size(): number {
		return this._fields.size.value
	}
	public set size(value: number) {
		this._fields.size.value = value
	}

	public get dir(): boolean {
		return this._fields.dir.value
	}
	public set dir(value: boolean) {
		this._fields.dir.value = value
	}

	public _fields: {
		name: $.VarRef<string>;
		size: $.VarRef<number>;
		dir: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{dir?: boolean, name?: string, size?: number}>) {
		this._fields = {
			name: $.varRef(init?.name ?? ""),
			size: $.varRef(init?.size ?? 0),
			dir: $.varRef(init?.dir ?? false)
		}
	}

	public clone(): MockFileInfo {
		const cloned = new MockFileInfo()
		cloned._fields = {
			name: $.varRef(this._fields.name.value),
			size: $.varRef(this._fields.size.value),
			dir: $.varRef(this._fields.dir.value)
		}
		return cloned
	}

	public Name(): string {
		const m = this
		return m.name
	}

	public Size(): number {
		const m = this
		return m.size
	}

	public Mode(): os.FileMode {
		return 0o644
	}

	public ModTime(): time.Time {
		return new time.Time({})
	}

	public IsDir(): boolean {
		const m = this
		return m.dir
	}

	public Sys(): null | any {
		return null
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MockFileInfo',
	  new MockFileInfo(),
	  [{ name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Mode", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "ModTime", args: [], returns: [{ type: "Time" }] }, { name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Sys", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }],
	  MockFileInfo,
	  {"name": { kind: $.TypeKind.Basic, name: "string" }, "size": { kind: $.TypeKind.Basic, name: "number" }, "dir": { kind: $.TypeKind.Basic, name: "boolean" }}
	);
}

export class MockFilesystem {
	public _fields: {
	}

	constructor(init?: Partial<{}>) {
		this._fields = {}
	}

	public clone(): MockFilesystem {
		const cloned = new MockFilesystem()
		cloned._fields = {
		}
		return cloned
	}

	public ReadDir(path: string): [$.Slice<os.FileInfo>, $.GoError] {
		return [$.arrayToSlice<os.FileInfo>([new MockFileInfo({dir: false, name: "file1.txt", size: 100}), new MockFileInfo({dir: true, name: "subdir", size: 0})]), null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MockFilesystem',
	  new MockFilesystem(),
	  [{ name: "ReadDir", args: [{ name: "path", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Interface, methods: [{ name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "ModTime", args: [], returns: [{ type: "Time" }] }, { name: "Mode", args: [], returns: [{ type: "FileMode" }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Sys", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }] } } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  MockFilesystem,
	  {}
	);
}

// This is the exact function signature from the user's example
// walkFn is filepath.WalkFunc which should be nullable and need ! operator
export function walk(fs: Filesystem, path: string, info: os.FileInfo, walkFn: filepath.WalkFunc | null): $.GoError {
	let filename = path + "/" + info!.Name()
	let fileInfo = info

	// This is the exact call that should generate walkFn!(filename, fileInfo, err)
	// but currently generates walkFn(filename, fileInfo, err) - missing !
	{
		let err = walkFn!(filename, fileInfo, null)
		if (err != null && err != filepath.SkipDir) {
			return err
		}
	}

	// Additional test case with error variable
	let walkErr: $.GoError = null
	{
		let err = walkFn!(filename, fileInfo, walkErr)
		if (err != null && err != filepath.SkipDir) {
			return err
		}
	}

	return null
}

// Additional test with direct filepath.WalkFunc usage
export function walkFiles(rootPath: string, walkFn: filepath.WalkFunc | null): $.GoError {
	// Test case: direct call to filepath.WalkFunc parameter
	// Should generate: walkFn!(rootPath, nil, nil)
	// Currently generates: walkFn(rootPath, nil, nil) - missing !
	return walkFn!(rootPath, null, null)
}

// Test with filepath.WalkFunc in different contexts
export function processPath(walkFn: filepath.WalkFunc | null): void {
	// Test case: function call in standalone statement
	// Should generate: walkFn!("test", nil, nil)
	walkFn!("test", null, null)

	// Test case: function call in if condition
	// Should generate: if walkFn!("test", nil, nil) != nil
	if (walkFn!("test", null, null) != null) {
		console.log("Error occurred")
	}
}

export async function main(): Promise<void> {
	let fs = new MockFilesystem({})
	let fileInfo = new MockFileInfo({dir: false, name: "test.txt", size: 50})

	// Test with actual filepath.WalkFunc
	let walkFunc = (path: string, info: os.FileInfo, err: $.GoError): $.GoError => {
		if (info != null) {
			console.log("Walking:", path, "size:", info!.Size())
		}
		if (err != null) {
			console.log("Error:", err!.Error())
		}
		return null
	}

	// Test the walk function
	let err = walk(fs, "/test", fileInfo, walkFunc)
	if (err != null) {
		console.log("Walk error:", err!.Error())
	}

	// Test walkFiles
	let err2 = walkFiles("/root", walkFunc)
	if (err2 != null) {
		console.log("WalkFiles error:", err2!.Error())
	}

	// Test processPath
	processPath(walkFunc)
}

