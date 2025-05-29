import * as $ from "@goscript/builtin/index.js";
import { ErrUnimplemented } from "./error.gs.js";

import * as fs from "@goscript/io/fs/index.js"
import * as io from "@goscript/io/index.js"
import * as time from "@goscript/time/index.js"
import * as syscall from "@goscript/syscall/index.js"

// Re-export essential types
export type Time = time.Time;
export type FileInfo = fs.FileInfo;
export type FileMode = fs.FileMode;
export type DirEntry = fs.DirEntry;

// Export runtime values for ES module compatibility  
export const Time = null as any;
export const FileInfo = null as any;
export const FileMode = null as any;
export const DirEntry = null as any;

// Getpagesize returns the underlying system's memory page size.
export function Getpagesize(): number {
	// Return a standard page size for JavaScript environment
	// Most systems use 4096 bytes as the default page size
	return 4096
}

// Stub implementation of File for JavaScript environment
export class File {
	public get file(): file | null {
		return null
	}
	public set file(value: file | null) {
		// No-op
	}

	public _fields: {
		file: $.VarRef<file | null>;
	}

	constructor(init?: Partial<{file?: file | null}>) {
		this._fields = {
			file: $.varRef(null)
		}
	}

	public clone(): File {
		return new File()
	}

	// All File methods return ErrUnimplemented in JavaScript environment
	public Readdir(n: number): [$.Slice<fs.FileInfo>, $.GoError] {
		return [null, ErrUnimplemented]
	}

	public Readdirnames(n: number): [$.Slice<string>, $.GoError] {
		return [null, ErrUnimplemented]
	}

	public ReadDir(n: number): [$.Slice<fs.DirEntry>, $.GoError] {
		return [null, ErrUnimplemented]
	}

	public readdir(n: number, mode: readdirMode): [$.Slice<string>, $.Slice<fs.DirEntry>, $.Slice<fs.FileInfo>, $.GoError] {
		return [null, null, null, ErrUnimplemented]
	}

	public Name(): string {
		return ""
	}

	public Read(b: $.Bytes): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public ReadAt(b: $.Bytes, off: number): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public ReadFrom(r: io.Reader): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public Write(b: $.Bytes): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public WriteAt(b: $.Bytes, off: number): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public WriteTo(w: io.Writer): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public Seek(offset: number, whence: number): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public WriteString(s: string): [number, $.GoError] {
		return [0, ErrUnimplemented]
	}

	public Chmod(mode: number): $.GoError {
		return ErrUnimplemented
	}

	public SetDeadline(t: time.Time): $.GoError {
		return ErrUnimplemented
	}

	public SetReadDeadline(t: time.Time): $.GoError {
		return ErrUnimplemented
	}

	public SetWriteDeadline(t: time.Time): $.GoError {
		return ErrUnimplemented
	}

	public SyscallConn(): [any, $.GoError] {
		return [null, ErrUnimplemented]
	}

	public Close(): $.GoError {
		return ErrUnimplemented
	}

	public Chown(uid: number, gid: number): $.GoError {
		return ErrUnimplemented
	}

	public Truncate(size: number): $.GoError {
		return ErrUnimplemented
	}

	public Sync(): $.GoError {
		return ErrUnimplemented
	}

	public Chdir(): $.GoError {
		return ErrUnimplemented
	}

	public Fd(): syscall.uintptr {
		return 0
	}

	public Stat(): [fs.FileInfo, $.GoError] {
		return [null, ErrUnimplemented]
	}

	// Internal methods
	public checkValid(op: string): $.GoError {
		return ErrUnimplemented
	}

	public wrapErr(op: string, err: $.GoError): $.GoError {
		return err
	}

	// Register this type with the runtime type system
	static __typeInfo = $.registerStructType(
		'File',
		new File(),
		[
			{ name: "Readdir", args: [{ name: "n", type: { kind: $.TypeKind.Basic, name: "number" } }], returns: [{ type: { kind: $.TypeKind.Slice, elemType: "FileInfo" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] },
			{ name: "Read", args: [{ name: "b", type: { kind: $.TypeKind.Slice, elemType: { kind: $.TypeKind.Basic, name: "number" } } }], returns: [{ type: { kind: $.TypeKind.Basic, name: "number" } }, { type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] },
			{ name: "Close", args: [], returns: [{ type: { kind: $.TypeKind.Interface, name: 'GoError', methods: [{ name: 'Error', args: [], returns: [{ type: { kind: $.TypeKind.Basic, name: 'string' } }] }] } }] }
		],
		File,
		{ "file": { kind: $.TypeKind.Pointer, elemType: "file" } }
	);
}

// Stub file type for internal use
class file {
	constructor() {}
}

// Stub readdirMode type
type readdirMode = number

// File mode constants
export let ModeDir: fs.FileMode = fs.ModeDir
export let ModeAppend: fs.FileMode = fs.ModeAppend
export let ModeExclusive: fs.FileMode = fs.ModeExclusive
export let ModeTemporary: fs.FileMode = fs.ModeTemporary
export let ModeSymlink: fs.FileMode = fs.ModeSymlink
export let ModeDevice: fs.FileMode = fs.ModeDevice
export let ModeNamedPipe: fs.FileMode = fs.ModeNamedPipe
export let ModeSocket: fs.FileMode = fs.ModeSocket
export let ModeSetuid: fs.FileMode = fs.ModeSetuid
export let ModeSetgid: fs.FileMode = fs.ModeSetgid
export let ModeCharDevice: fs.FileMode = fs.ModeCharDevice
export let ModeSticky: fs.FileMode = fs.ModeSticky
export let ModeIrregular: fs.FileMode = fs.ModeIrregular

export let ModeType: fs.FileMode = fs.ModeType
export let ModePerm: fs.FileMode = fs.ModePerm

// SameFile reports whether fi1 and fi2 describe the same file.
export function SameFile(fi1: fs.FileInfo, fi2: fs.FileInfo): boolean {
	// In JavaScript environment, always return false as we can't compare files
	return false
} 