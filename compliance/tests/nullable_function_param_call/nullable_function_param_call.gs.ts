// Generated file based on nullable_function_param_call.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as os from "@goscript/os/index.js"

export type FileInfo = null | {
	IsDir(): boolean
	Name(): string
	Size(): number
}

$.registerInterfaceType(
  'FileInfo',
  null, // Zero value for interface is null
  [{ name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }]
);

export type WalkFunc = ((path: string, info: FileInfo, err: $.GoError) => $.GoError) | null;

export let SkipDir: $.GoError = os.ErrNotExist

export type Filesystem = null | {
	ReadDir(path: string): [$.Slice<FileInfo>, $.GoError]
}

$.registerInterfaceType(
  'Filesystem',
  null, // Zero value for interface is null
  [{ name: "ReadDir", args: [{ name: "path", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: "FileInfo" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
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

	public get isDir(): boolean {
		return this._fields.isDir.value
	}
	public set isDir(value: boolean) {
		this._fields.isDir.value = value
	}

	public _fields: {
		name: $.VarRef<string>;
		size: $.VarRef<number>;
		isDir: $.VarRef<boolean>;
	}

	constructor(init?: Partial<{isDir?: boolean, name?: string, size?: number}>) {
		this._fields = {
			name: $.varRef(init?.name ?? ""),
			size: $.varRef(init?.size ?? 0),
			isDir: $.varRef(init?.isDir ?? false)
		}
	}

	public clone(): MockFileInfo {
		const cloned = new MockFileInfo()
		cloned._fields = {
			name: $.varRef(this._fields.name.value),
			size: $.varRef(this._fields.size.value),
			isDir: $.varRef(this._fields.isDir.value)
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

	public IsDir(): boolean {
		const m = this
		return m.isDir
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MockFileInfo',
	  new MockFileInfo(),
	  [{ name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }],
	  MockFileInfo,
	  {"name": { kind: $.TypeKind.Basic, name: "string" }, "size": { kind: $.TypeKind.Basic, name: "number" }, "isDir": { kind: $.TypeKind.Basic, name: "boolean" }}
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

	public ReadDir(path: string): [$.Slice<FileInfo>, $.GoError] {
		return [$.arrayToSlice<FileInfo>([new MockFileInfo({isDir: false, name: "file1.txt", size: 100}), new MockFileInfo({isDir: true, name: "subdir", size: 0})]), null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MockFilesystem',
	  new MockFilesystem(),
	  [{ name: "ReadDir", args: [{ name: "path", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: "FileInfo" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  MockFilesystem,
	  {}
	);
}

// walk is a simplified version of filepath.Walk that demonstrates the issue
// walkFn is a nullable function parameter that needs non-null assertion when called
export function walk(fs: Filesystem, path: string, info: FileInfo, walkFn: WalkFunc | null): $.GoError {
	// Test case 1: Direct call to nullable function parameter
	// This should generate: walkFn!(path, info, nil)
	// But currently generates: walkFn(path, info, nil) - missing !
	let err = walkFn!(path, info, null)
	if (err != null && err != SkipDir) {
		return err
	}

	// Test case 2: Call with error parameter
	let walkErr: $.GoError = null
	// This should also generate: walkFn!(path, info, walkErr)
	let result = walkFn!(path, info, walkErr)
	if (result != null) {
		return result
	}

	return null
}

export type ProcessFunc = ((data: string) => [string, $.GoError]) | null;

export function processWithCallback(input: string, processor: ProcessFunc | null): [string, $.GoError] {
	// Test case 3: Function parameter with return values
	// This should generate: processor!(input)
	// But currently generates: processor(input) - missing !
	return processor!(input)
}

export async function main(): Promise<void> {
	let fs = new MockFilesystem({})
	let fileInfo = new MockFileInfo({isDir: false, name: "test.txt", size: 50})

	// Test the walk function with a callback
	let walkFunc = (path: string, info: FileInfo, err: $.GoError): $.GoError => {
		console.log("Walking:", path, "size:", info!.Size())
		if (err != null) {
			console.log("Error:", err!.Error())
		}
		return null
	}

	let err = walk(fs, "/test", fileInfo, walkFunc)
	if (err != null) {
		console.log("Walk error:", err!.Error())
	}

	// Test the process function with a callback
	let processFunc = (data: string): [string, $.GoError] => {
		return ["processed: " + data, null]
	}

	let [result, err2] = processWithCallback("hello", processFunc)
	if (err2 != null) {
		console.log("Process error:", err2!.Error())
	}
	 else {
		console.log("Process result:", result)
	}
}

