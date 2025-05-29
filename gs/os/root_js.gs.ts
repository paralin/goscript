import * as $ from "@goscript/builtin/index.js";
import { ErrUnimplemented } from "./error.gs.js";
import { File } from "./types_js.gs.js";

import * as fs from "@goscript/io/fs/index.js"

// JavaScript-specific implementations for root filesystem operations
// These functions stub operations that cannot be implemented in JavaScript

// OpenInRoot opens the file name in the directory dir - stub implementation
export function OpenInRoot(dir: string, name: string): [File | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// Root represents a root filesystem - stub implementation
export class Root {
	constructor() {}

	// Name returns the name of the directory presented to OpenRoot
	public Name(): string {
		return ""
	}

	// Close closes the Root
	public Close(): $.GoError {
		return ErrUnimplemented
	}

	// Open opens the named file in the root for reading
	public Open(name: string): [File | null, $.GoError] {
		return [null, ErrUnimplemented]
	}

	// Create creates or truncates the named file in the root
	public Create(name: string): [File | null, $.GoError] {
		return [null, ErrUnimplemented]
	}

	// OpenFile opens the named file in the root
	public OpenFile(name: string, flag: number, perm: number): [File | null, $.GoError] {
		return [null, ErrUnimplemented]
	}

	// OpenRoot opens the named directory in the root
	public OpenRoot(name: string): [RootType | null, $.GoError] {
		return [null, ErrUnimplemented]
	}

	// Mkdir creates a new directory in the root
	public Mkdir(name: string, perm: number): $.GoError {
		return ErrUnimplemented
	}

	// Remove removes the named file or directory in the root
	public Remove(name: string): $.GoError {
		return ErrUnimplemented
	}

	// Stat returns a FileInfo describing the named file in the root
	public Stat(name: string): [fs.FileInfo | null, $.GoError] {
		return [null, ErrUnimplemented]
	}

	// Lstat returns a FileInfo describing the named file in the root
	public Lstat(name: string): [fs.FileInfo | null, $.GoError] {
		return [null, ErrUnimplemented]
	}

	// FS returns a file system for the tree of files in the root
	public FS(): fs.FS {
		return new stubFS()
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
		'Root',
		new Root(),
		[
			{ name: "Name", args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] },
			{ name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }
		],
		Root,
		{}
	);
}

// Type alias to avoid conflicts
export type RootType = Root

// OpenRoot opens a root filesystem - stub implementation
export function OpenRoot(name: string): [Root | null, $.GoError] {
	return [null, ErrUnimplemented]
}

// splitPathInRoot splits a path in root - stub implementation
export function splitPathInRoot(s: string, prefix: $.Slice<string> | null, suffix: $.Slice<string> | null): [$.Slice<string>, string, $.GoError] {
	return [null, "", ErrUnimplemented]
}

// isValidRootFSPath checks if a path is valid for root filesystem - stub implementation
export function isValidRootFSPath(name: string): boolean {
	return false
}

// Internal stub filesystem
class stubFS {
	public Open(name: string): [fs.File, $.GoError] {
		return [null, ErrUnimplemented]
	}
}

