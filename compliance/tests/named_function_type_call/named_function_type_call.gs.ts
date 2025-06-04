// Generated file based on named_function_type_call.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as filepath from "@goscript/path/filepath/index.js"

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

export type WalkFunc = ((path: string, info: FileInfo, err: $.GoError) => $.GoError) | null;

// walk demonstrates the issue with named function types
// This uses filepath.WalkFunc which is a named function type from external package
export function walk(fs: Filesystem, path: string, info: FileInfo, walkFn: filepath.WalkFunc | null): $.GoError {
	// Test case 1: Direct call to named function type parameter
	// This should generate: walkFn!(path, info, nil)
	// But currently generates: walkFn(path, info, nil) - missing !

	// We need to convert our FileInfo to os.FileInfo for filepath.WalkFunc
	// For this test, we'll use a simpler approach with our own WalkFunc

	// This simulates the issue by calling filepath.WalkFunc indirectly
	return walkWithCustomFunc(fs, path, info, (p: string, i: FileInfo, e: $.GoError): $.GoError => {
		// This simulates the issue by calling filepath.WalkFunc indirectly
		return null
	})
}

// walkWithCustomFunc uses our custom WalkFunc type
export function walkWithCustomFunc(fs: Filesystem, path: string, info: FileInfo, walkFn: WalkFunc | null): $.GoError {
	// Test case 1: Direct call to named function type parameter
	// This should generate: walkFn!(path, info, nil)
	// But currently generates: walkFn(path, info, nil) - missing !
	{
		let err = walkFn!(path, info, null)
		if (err != null && err != filepath.SkipDir) {
			return err
		}
	}

	// Test case 2: Call with variable error
	let walkErr: $.GoError = null
	// This should also generate: walkFn!(path, info, walkErr)
	{
		let err = walkFn!(path, info, walkErr)
		if (err != null && err != filepath.SkipDir) {
			return err
		}
	}

	// Test case 3: Call in if statement condition
	// This should generate: walkFn!(path, info, nil)
	if (walkFn!(path, info, null) != null) {
		return filepath.SkipDir
	}

	return null
}

// Additional test with different named function type
export function processFiles(pattern: string, fn: ((p0: string) => $.GoError) | null): $.GoError {
	// Test case 4: Anonymous function type parameter (for comparison)
	// This should also have ! operator when called
	return fn!(pattern)
}

// Test with multiple named function types
export function multiCallback(walkFn: WalkFunc | null, processFn: ((p0: string) => $.GoError) | null): $.GoError {
	// Test case 5: Multiple function parameters
	// Both should generate ! operators
	{
		let err = walkFn!("test", null, null)
		if (err != null) {
			return err
		}
	}
	return processFn!("test")
}

export async function main(): Promise<void> {
	let fs = new MockFilesystem({})
	let fileInfo = new MockFileInfo({isDir: false, name: "test.txt", size: 50})

	// Test the walk function with custom WalkFunc
	let walkFunc = (path: string, info: FileInfo, err: $.GoError): $.GoError => {
		if (info != null) {
			console.log("Walking:", path, "size:", info!.Size())
		}
		if (err != null) {
			console.log("Error:", err!.Error())
		}
		return null
	}

	let err = walkWithCustomFunc(fs, "/test", fileInfo, walkFunc)
	if (err != null) {
		console.log("Walk error:", err!.Error())
	}

	// Test with processFiles
	let processFunc = (pattern: string): $.GoError => {
		console.log("Processing pattern:", pattern)
		return null
	}

	let err2 = processFiles("*.go", processFunc)
	if (err2 != null) {
		console.log("Process error:", err2!.Error())
	}

	// Test with multiCallback
	let err3 = multiCallback(walkFunc, processFunc)
	if (err3 != null) {
		console.log("Multi callback error:", err3!.Error())
	}
}

