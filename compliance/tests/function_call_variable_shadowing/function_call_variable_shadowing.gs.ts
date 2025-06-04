// Generated file based on function_call_variable_shadowing.go
// Updated when compliance tests are re-run, DO NOT EDIT!

import * as $ from "@goscript/builtin/index.js";

import * as os from "@goscript/os/index.js"

import * as filepath from "@goscript/path/filepath/index.js"

export type Filesystem = null | {
	Lstat(filename: string): [os.FileInfo, $.GoError]
}

$.registerInterfaceType(
  'Filesystem',
  null, // Zero value for interface is null
  [{ name: "Lstat", args: [{ name: "filename", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Interface, methods: [{ name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "ModTime", args: [], returns: [{ type: "Time" }] }, { name: "Mode", args: [], returns: [{ type: "FileMode" }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Sys", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }] } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }]
);

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

	public Lstat(filename: string): [os.FileInfo, $.GoError] {
		return [null, null]
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
	  'MockFilesystem',
	  new MockFilesystem(),
	  [{ name: "Lstat", args: [{ name: "filename", type: { kind: $.TypeKind.Basic, name: "string" } }], returns: [{ type: { kind: $.TypeKind.Interface, methods: [{ name: "IsDir", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "boolean" } }] }, { name: "ModTime", args: [], returns: [{ type: "Time" }] }, { name: "Mode", args: [], returns: [{ type: "FileMode" }] }, { name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "string" } }] }, { name: "Size", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }] }, { name: "Sys", args: [], returns: [{ type: { kind: $.TypeKind.Interface, methods: [] } }] }] } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }],
	  MockFilesystem,
	  {}
	);
}

// Reproduce the exact variable shadowing scenario that causes the issue
export function walkWithShadowing(fs: Filesystem, path: string, info: os.FileInfo, walkFn: filepath.WalkFunc | null): $.GoError {
	// This reproduces the exact pattern from the user's code
	// where variable shadowing occurs with := assignment
	let [fileInfo, err] = fs!.Lstat(path)

	// This is the problematic line that generates:
	// let err = walkFn(filename, fileInfo, _temp_err) - missing !
	// Instead of:
	// let err = walkFn!(filename, fileInfo, _temp_err) - with !
	if (err != null) {
		// This is the problematic line that generates:
		// let err = walkFn(filename, fileInfo, _temp_err) - missing !
		// Instead of:
		// let err = walkFn!(filename, fileInfo, _temp_err) - with !
		const _temp_err = err
		{
			let err = walkFn!(path, fileInfo, _temp_err)
			if (err != null && err != filepath.SkipDir) {
				return err
			}
		}
	}
	return null
}

// Additional test cases with different variable shadowing scenarios
export function testShadowing1(walkFn: filepath.WalkFunc | null): $.GoError {
	let err: $.GoError = null
	// Case 1: Direct shadowing with if statement
	const _temp_err = err
	{
		let err = walkFn!("test1", null, _temp_err)
		if (err != null) {
			return err
		}
	}
	return null
}

export function testShadowing2(walkFn: filepath.WalkFunc | null): $.GoError {
	// Case 2: Multiple levels of shadowing
	let outerErr = os.ErrNotExist // Use a known error instead of errors.New
	{
		{
			let err = walkFn!("test2", null, outerErr)
			if (err != null) {
				return err
			}
		}
	}
	return null
}

export function testShadowing3(walkFn: filepath.WalkFunc | null): $.GoError {
	// Case 3: Shadowing in for loop
	let errorList = $.arrayToSlice<$.GoError>([null, os.ErrNotExist]) // Use os.ErrNotExist instead of errors.New
	for (let _i = 0; _i < $.len(errorList); _i++) {
		const err = errorList![_i]
		{
			const _temp_err = err
			{
				let err = walkFn!("test3", null, _temp_err)
				if (err != null) {
					return err
				}
			}
		}
	}
	return null
}

// Non-shadowing case for comparison
export function testNoShadowing(walkFn: filepath.WalkFunc | null): $.GoError {
	// This should work correctly (no shadowing)
	return walkFn!("test", null, null)
}

export async function main(): Promise<void> {
	let fs = new MockFilesystem({})

	let walkFunc = (path: string, info: os.FileInfo, err: $.GoError): $.GoError => {
		if (err != null) {
			console.log("Error:", err!.Error())
		}
		console.log("Walking:", path)
		return null
	}

	// Test the shadowing scenario
	let err = walkWithShadowing(fs, "/test", null, walkFunc)
	if (err != null) {
		console.log("Error:", err!.Error())
	}

	// Test other shadowing cases
	testShadowing1(walkFunc)
	testShadowing2(walkFunc)
	testShadowing3(walkFunc)
	testNoShadowing(walkFunc)
}

